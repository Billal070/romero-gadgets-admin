import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, RefreshCw, Star, Trash2 } from 'lucide-react'
import { Button, Badge, Skeleton } from './ui'
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_MAX_COUNT,
  listProductImages,
  saveProductImageState,
  validateProductImage,
} from '../lib/productImages'
import { useToast } from '../hooks/useToast'

function createKey(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const ProductImageManager = forwardRef(function ProductImageManager({ productId }, ref) {
  const [images, setImages] = useState([])
  const [deleted, setDeleted] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [replaceKey, setReplaceKey] = useState(null)
  const addInputRef = useRef(null)
  const replaceInputRef = useRef(null)
  const previewUrlsRef = useRef(new Set())
  const { addToast } = useToast()

  const trackPreview = (file) => {
    const url = URL.createObjectURL(file)
    previewUrlsRef.current.add(url)
    return url
  }

  const untrackPreview = (url) => {
    if (!url) return
    if (previewUrlsRef.current.has(url)) {
      previewUrlsRef.current.delete(url)
      URL.revokeObjectURL(url)
    }
  }

  useEffect(() => {
    let cancelled = false
    setDeleted([])
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    previewUrlsRef.current.clear()

    if (!productId) {
      setImages([])
      return undefined
    }

    setLoading(true)
    listProductImages(productId)
      .then(rows => {
        if (cancelled) return
        setImages(rows.map((row, index) => ({
          key: row.id,
          id: row.id,
          image_url: row.image_url,
          alt_text: row.alt_text || '',
          sort_order: row.sort_order ?? index,
          is_primary: Boolean(row.is_primary),
          previewUrl: null,
          file: null,
          replacementFile: null,
        })))
      })
      .catch(err => addToast(err.message || 'Could not load product images', 'error'))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [productId, addToast])

  useEffect(() => () => {
    previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    previewUrlsRef.current.clear()
  }, [])

  const renumber = (list) => list.map((image, index) => ({ ...image, sort_order: index }))

  const ensurePrimary = (list) => {
    if (list.length && !list.some(image => image.is_primary)) {
      return list.map((image, index) => (index === 0 ? { ...image, is_primary: true } : image))
    }
    return list
  }

  const addFiles = (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return

    if (images.length + files.length > PRODUCT_IMAGE_MAX_COUNT) {
      addToast(`A product can have up to ${PRODUCT_IMAGE_MAX_COUNT} images`, 'error')
      return
    }

    for (const file of files) {
      const problem = validateProductImage(file)
      if (problem) {
        addToast(problem, 'error')
        return
      }
    }

    setImages(prev => ensurePrimary(renumber([
      ...prev,
      ...files.map(file => ({
        key: createKey('pending'),
        id: null,
        image_url: '',
        alt_text: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        sort_order: prev.length,
        is_primary: prev.length === 0,
        previewUrl: trackPreview(file),
        file,
        replacementFile: null,
      })),
    ])))
  }

  const replaceFile = (fileList) => {
    const file = fileList?.[0]
    if (!file || !replaceKey) return
    const problem = validateProductImage(file)
    if (problem) {
      addToast(problem, 'error')
      return
    }

    setImages(prev => prev.map(image => {
      if (image.key !== replaceKey) return image
      untrackPreview(image.previewUrl)
      return { ...image, previewUrl: trackPreview(file), replacementFile: file }
    }))
    setReplaceKey(null)
  }

  const removeImage = (key) => {
    setImages(prev => {
      const target = prev.find(image => image.key === key)
      if (target?.id) setDeleted(current => [...current, target])
      untrackPreview(target?.previewUrl)
      return ensurePrimary(renumber(prev.filter(image => image.key !== key)))
    })
  }

  const moveImage = (key, direction) => {
    setImages(prev => {
      const index = prev.findIndex(image => image.key === key)
      const nextIndex = index + direction
      if (index === -1 || nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return renumber(next)
    })
  }

  const setPrimary = (key) => {
    setImages(prev => prev.map(image => ({ ...image, is_primary: image.key === key })))
  }

  const setAlt = (key, value) => {
    setImages(prev => prev.map(image => (image.key === key ? { ...image, alt_text: value } : image)))
  }

  const save = async (productIdToSave) => {
    setSaving(true)
    try {
      const { saved } = await saveProductImageState({ productId: productIdToSave, images, deleted })
      setDeleted([])
      setImages(saved.map(row => ({
        key: row.id,
        id: row.id,
        image_url: row.image_url,
        alt_text: row.alt_text || '',
        sort_order: row.sort_order,
        is_primary: Boolean(row.is_primary),
        previewUrl: null,
        file: null,
        replacementFile: null,
      })))
      return saved
    } finally {
      setSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({ save }), [images, deleted])

  return (
    <div className="md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="block text-sm font-semibold text-navy-900">Product Images</span>
          <span className="block text-xs text-gray-500 mt-0.5">
            {images.length
              ? `${images.length} image${images.length === 1 ? '' : 's'} · first image is primary unless changed`
              : 'No images yet. Upload JPG, PNG, or WebP files up to 5MB.'}
          </span>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={() => addInputRef.current?.click()} disabled={saving}>
          <ImagePlus className="w-4 h-4" /> Add Images
        </Button>
      </div>

      <input
        ref={addInputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => { replaceFile(e.target.files); e.target.value = '' }}
      />

      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44" />)}
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center text-sm text-gray-500">
            Image previews will appear here before the product is saved.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={image.key} className="rounded-xl border border-gray-100 bg-white p-3 shadow-card">
                <div className="relative overflow-hidden rounded-lg bg-gray-100">
                  {(image.previewUrl || image.image_url) ? (
                    <img
                      src={image.previewUrl || image.image_url}
                      alt={image.alt_text || `Product image ${index + 1}`}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center text-xs text-gray-400">Preview unavailable</div>
                  )}
                  <div className="absolute left-2 top-2 flex gap-2">
                    {image.is_primary && <Badge color="navy"><Star className="w-3 h-3" /> Primary</Badge>}
                    {(image.file || image.replacementFile) && <Badge color="amber">Unsaved</Badge>}
                  </div>
                  <span className="absolute right-2 top-2 rounded-full bg-navy-950/70 px-2 py-0.5 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                </div>

                <input
                  value={image.alt_text}
                  onChange={(e) => setAlt(image.key, e.target.value)}
                  placeholder="Image description"
                  aria-label={`Image ${index + 1} description`}
                  className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-navy-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPrimary(image.key)}
                    disabled={image.is_primary}
                    title="Set as primary"
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <Star className="w-3.5 h-3.5" /> Primary
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(image.key, -1)}
                    disabled={index === 0}
                    title="Move left"
                    aria-label={`Move image ${index + 1} earlier`}
                    className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(image.key, 1)}
                    disabled={index === images.length - 1}
                    title="Move right"
                    aria-label={`Move image ${index + 1} later`}
                    className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReplaceKey(image.key); replaceInputRef.current?.click() }}
                    title="Replace image"
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(image.key)}
                    title="Delete image"
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

export default ProductImageManager
