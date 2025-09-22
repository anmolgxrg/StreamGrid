import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { AuthService } from '../services/authService'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { user, session } = await AuthService.getCurrentUser()
      setUser(user)
      setSession(session)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange((user, session) => {
      setUser(user)
      setSession(session)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await AuthService.signIn(email, password)
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await AuthService.signOut()
    return { error }
  }

  return {
    user,
    session,
    loading,
    signIn,
    signOut
  }
}
