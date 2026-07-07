import { supabase, isSupabaseConfigured } from './supabase'

export async function signInAdmin(email: string, password: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado. Contacta o administrador.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('id', data.user.id)
    .single()
  
  if (!admin) {
    throw new Error('Não autorizado')
  }
  
  return { user: data.user, admin }
}

export async function signOut() {
  if (!isSupabaseConfigured) return
  await supabase.auth.signOut()
}

export async function getCurrentAdmin() {
  if (!isSupabaseConfigured) return null
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return null
  
  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('id', session.user.id)
    .single()
  
  return admin
}
