import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  const checkAdmin = useCallback(async (userId) => {
    if (!userId) {
      setAdminUser(null)
      setAuthError(null)
      return null
    }
    // maybeSingle, not single: single() raises PGRST116 when zero rows
    // come back, which is the normal case for a valid auth user that has
    // no admin_users row yet.
    const { data, error } = await supabase
      .from('admin_users')
      .select('*, roles(name, permissions)')
      .eq('id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      setAdminUser(null)
      setAuthError(error.message)
      return null
    }

    setAdminUser(data || null)
    setAuthError(data ? null : 'This account is not registered as an admin.')
    return data || null
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      checkAdmin(session?.user?.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      checkAdmin(session?.user?.id)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [checkAdmin])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setAdminUser(null)
  }

  const isAdmin = !!adminUser
  const permissions = adminUser?.roles?.permissions || []
  const roleName = adminUser?.roles?.name

  const hasPermission = useCallback((perm) => {
    if (permissions.includes('*')) return true
    return permissions.includes(perm)
  }, [permissions])

  return (
    <AuthContext.Provider value={{
      session,
      adminUser,
      loading,
      authError,
      isAdmin,
      permissions,
      roleName,
      hasPermission,
      signIn,
      signOut,
      checkAdmin
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
