import { supabase } from '../lib/supabase'

export class AuthService {
  // Login com email e senha
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }

  // Registro de novo usuário
  async signUp(email: string, password: string, name: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      })
      
      if (error) throw error
      
      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Erro no registro:', error)
      throw error
    }
  }

  // Logout
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Erro no logout:', error)
      throw error
    }
  }

  // Verificar sessão atual
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Erro ao obter sessão:', error)
      throw error
    }
  }

  // Escutar mudanças de autenticação
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Reset de senha
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'gabifamilydocs://reset-password'
      })
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Erro no reset de senha:', error)
      throw error
    }
  }

  // Atualizar senha
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar senha:', error)
      throw error
    }
  }

  // Obter usuário atual
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Erro ao obter usuário:', error)
      throw error
    }
  }
}

export const authService = new AuthService()
