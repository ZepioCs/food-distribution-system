import { createClient } from '@supabase/supabase-js'
import { EUserRole } from '@/models/default'

const supabaseUrl = 'https://cjchxqsljrbuporgvrza.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ""
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'fooddist_auth_token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
})

export interface AuthCredentials {
  email: string
  password: string
}

export interface RegisterData extends AuthCredentials {
  username: string
  role: EUserRole
}

const SESSION_TIMEOUT = 30 * 60 * 1000

class AuthService {
  async login({ email, password }: AuthCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error

    // Set session timeout
    if (typeof window !== 'undefined') {
      const timeout = setTimeout(() => {
        void this.logout()
      }, SESSION_TIMEOUT)

      // Store the timeout ID
      window.localStorage.setItem('session_timeout', timeout.toString())
    }

    return data
  }

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }

  async register({ email, password, username, role }: RegisterData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role,
        },
      },
    })

    if (error) throw error

    // Create user profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          user_id: data.user?.id,
          username,
          role,
          email,
        },
      ])

    if (profileError) throw profileError
    return data
  }

  async logout() {
    // Clear the session timeout
    if (typeof window !== 'undefined') {
      const timeoutId = window.localStorage.getItem('session_timeout')
      if (timeoutId) {
        clearTimeout(parseInt(timeoutId))
        window.localStorage.removeItem('session_timeout')
      }
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async refreshSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return false
    }

    // Reset the session timeout
    if (typeof window !== 'undefined') {
      const oldTimeoutId = window.localStorage.getItem('session_timeout')
      if (oldTimeoutId) {
        clearTimeout(parseInt(oldTimeoutId))
      }

      const timeout = setTimeout(() => {
        void this.logout()
      }, SESSION_TIMEOUT)

      window.localStorage.setItem('session_timeout', timeout.toString())
    }

    return true
  }

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }
}

export const authService = new AuthService()

export { supabase }