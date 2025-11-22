import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  fullName: string | null
  avatar?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Auth error:', error)
        setError(error.message)
      }
      setUser(session?.user ?? null)
      
      // Extract full_name from user metadata
      if (session?.user) {
        const fullName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        setUserProfile({
          id: session.user.id,
          email: session.user.email || '',
          fullName: fullName,
        })
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const fullName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        setUserProfile({
          id: session.user.id,
          email: session.user.email || '',
          fullName: fullName,
        })
      } else {
        setUserProfile(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) throw signUpError
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      setError(message)
      throw err
    }
  }

  const signIn = async (email: string, password: string) => {
    setError(null)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      setError(message)
      throw err
    }
  }

  const signOut = async () => {
    setError(null)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed'
      setError(message)
      throw err
    }
  }

  const resetPassword = async (email: string) => {
    setError(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed'
      setError(message)
      throw err
    }
  }

  return {
    user,
    userProfile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }
}