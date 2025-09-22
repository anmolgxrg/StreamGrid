import { supabase } from '../config/supabase'
import { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  user: User | null
  session: Session | null
}

export class AuthService {
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  static async getCurrentUser(): Promise<AuthUser> {
    const { data: { user, session } } = await supabase.auth.getUser()
    return { user, session }
  }

  static onAuthStateChange(callback: (user: User | null, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null, session)
    })
  }
}
