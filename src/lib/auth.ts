import { supabase } from './supabase'

export async function signInAdmin(email: string, password: string) {
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
  await supabase.auth.signOut()
}

export async function getCurrentAdmin() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return null
  
  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('id', session.user.id)
    .single()
  
  return admin
}
