import { supabase } from './supabase'

export const PRODUCT_IMAGE_BUCKET = 'product-images'
export const PRODUCT_IMAGE_MAX_SIZE = 5 * 1024 * 1024
export const PRODUCT_IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const PRODUCT_IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp'
export const PRODUCT_IMAGE_MAX_COUNT = 10

export function validateProductImage(file) {
  if (!file) return 'No file was selected'
  if (!PRODUCT_IMAGE_ACCEPTED_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, or WebP images are supported'
  }
  if (file.size > PRODUCT_IMAGE_MAX_SIZE) {
    return 'Images must be 5MB or smaller'
  }
  return null
}

function randomSuffix() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

function extensionFor(file) {
  const fromName = file.name?.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{2,4}$/.test(fromName)) return fromName
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

export function storagePathForUpload(productId, file) {
  return `products/${productId}/${Date.now()}-${randomSuffix()}.${extensionFor(file)}`
}

function storageErrorMessage(error, action) {
  const message = error?.message || 'Unknown storage error'
  if (/bucket not found/i.test(message)) {
    return `${action} failed: the "${PRODUCT_IMAGE_BUCKET}" storage bucket does not exist. Run supabase/004_product_image_storage.sql, then try again.`
  }
  return `${action} failed: ${message}`
}

export async function uploadProductImageFile(productId, file) {
  const path = storagePathForUpload(productId, file)
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(storageErrorMessage(error, 'Image upload'))

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path)
  if (!data?.publicUrl) throw new Error('Image upload failed: Supabase did not return a public URL')

  return { path, publicUrl: data.publicUrl }
}

export function storagePathFromImageUrl(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl) return ''
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`
  const index = imageUrl.indexOf(marker)
  if (index === -1) return ''
  return decodeURIComponent(imageUrl.slice(index + marker.length))
}

export async function deleteProductImageObject(imageUrl) {
  const path = storagePathFromImageUrl(imageUrl)
  if (!path) return false

  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path])
  if (error) throw new Error(storageErrorMessage(error, 'Image delete'))
  return true
}

export async function listProductImages(productId) {
  if (!productId) return []
  const { data, error } = await supabase
    .from('product_images')
    .select('id, product_id, image_url, alt_text, sort_order, is_primary')
    .eq('product_id', productId)
    .order('sort_order')

  if (error) throw new Error(`Could not load product images: ${error.message}`)
  return data || []
}

function normalizeImageOrder(images) {
  let primaryFound = false
  const ordered = images.map((image, index) => {
    const isPrimary = Boolean(image.is_primary) && !primaryFound
    if (isPrimary) primaryFound = true
    return { ...image, sort_order: index, is_primary: isPrimary }
  })
  if (ordered.length && !primaryFound) {
    ordered[0] = { ...ordered[0], is_primary: true }
  }
  return ordered
}

export async function saveProductImageState({ productId, images = [], deleted = [] }) {
  if (!productId) throw new Error('A product must be saved before its images can be saved')

  const ordered = normalizeImageOrder(images)

  // Upload new and replacement files before changing database rows.
  const uploaded = []
  for (const image of ordered) {
    const file = image.replacementFile || image.file
    if (!file) continue
    const previousUrl = image.replacementFile ? image.image_url : ''
    const { publicUrl } = await uploadProductImageFile(productId, file)
    uploaded.push(image)
    image.image_url = publicUrl
    image.file = null
    image.replacementFile = null
    image.previewUrl = null
    if (previousUrl && previousUrl !== publicUrl) {
      try {
        await deleteProductImageObject(previousUrl)
      } catch {
        // The replacement is already saved; leave cleanup to a later save.
      }
    }
  }

  const updates = ordered.filter(image => image.id).map(image => (
    supabase
      .from('product_images')
      .update({
        image_url: image.image_url,
        alt_text: image.alt_text || '',
        sort_order: image.sort_order,
        is_primary: Boolean(image.is_primary),
      })
      .eq('id', image.id)
  ))

  const inserts = ordered
    .filter(image => !image.id)
    .map(image => ({
      product_id: productId,
      image_url: image.image_url,
      alt_text: image.alt_text || '',
      sort_order: image.sort_order,
      is_primary: Boolean(image.is_primary),
    }))

  const results = await Promise.all(updates)
  const failedUpdate = results.find(result => result.error)
  if (failedUpdate) throw new Error(`Could not update product images: ${failedUpdate.error.message}`)

  let inserted = []
  if (inserts.length) {
    const { data, error } = await supabase.from('product_images').insert(inserts).select()
    if (error) throw new Error(`Could not save product images: ${error.message}`)
    inserted = data || []
  }

  const saved = [
    ...ordered.filter(image => image.id),
    ...inserts.map((image, index) => ({ ...image, id: inserted[index]?.id || image.key })),
  ].sort((a, b) => a.sort_order - b.sort_order)

  // Delete removed rows after replacements/uploads have succeeded.
  for (const removed of deleted) {
    if (!removed?.id) continue
    const { error } = await supabase.from('product_images').delete().eq('id', removed.id)
    if (error) throw new Error(`Could not delete a product image: ${error.message}`)
    try {
      await deleteProductImageObject(removed.image_url)
    } catch {
      // The database row is gone; storage cleanup can be retried later.
    }
  }

  return { saved, uploadedCount: uploaded.length }
}

export async function deleteProductImageObjects(productId) {
  if (!productId) return 0
  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .list(`products/${productId}`)

  if (error) throw new Error(storageErrorMessage(error, 'Product image cleanup'))
  if (!data?.length) return 0

  const paths = data.map(file => `products/${productId}/${file.name}`)
  const { error: removeError } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths)
  if (removeError) throw new Error(storageErrorMessage(removeError, 'Product image cleanup'))
  return paths.length
}
