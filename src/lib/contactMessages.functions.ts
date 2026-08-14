import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export type ContactMessage = {
  id: string
  name: string
  phone: string
  email: string | null
  message: string
  read_at: string | null
  created_at: string
  updated_at: string
}

type ContactInput = { name: string; phone: string; email?: string; message: string }

function validateContact(input: ContactInput): ContactInput {
  const name = input.name.trim()
  const phone = input.phone.trim()
  const email = (input.email ?? '').trim()
  const message = input.message.trim()
  if (name.length < 1 || name.length > 120) throw new Error('Please enter a valid name.')
  if (phone.length < 3 || phone.length > 40) throw new Error('Please enter a valid phone number.')
  if (email.length > 254) throw new Error('Email is too long.')
  if (message.length < 1 || message.length > 5000) throw new Error('Please enter a valid message.')
  return { name, phone, email, message }
}

/** Public contact form submission. The server-only client keeps persistence independent of anon-key/RLS drift. */
export const submitContactMessage = createServerFn({ method: 'POST' })
  .validator((raw: ContactInput) => validateContact(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin.from('contact_messages' as never).insert({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      message: data.message,
    } as never)
    if (error) throw new Error(error.message)
    return { ok: true as const }
  })

/** Verify the caller’s admin role before using the server-only client. */
async function requireContactAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.from('user_roles').select('role').eq('user_id', context.userId)
  if (error) throw new Error(error.message)
  const allowed = (data ?? []).some((row: { role: string }) => row.role === 'admin' || row.role === 'super_admin')
  if (!allowed) throw new Error('Forbidden')
}

/** Admin inbox list. Authorization is checked explicitly before the server-only query. */
export const listContactMessages = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ContactMessage[]> => {
    await requireContactAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data, error } = await supabaseAdmin
      .from('contact_messages' as never)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as ContactMessage[]
  })

export const markContactMessageRead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((input: { id: string; read: boolean }) => input)
  .handler(async ({ context, data }) => {
    await requireContactAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin
      .from('contact_messages' as never)
      .update({ read_at: data.read ? new Date().toISOString() : null } as never)
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true as const }
  })

export const deleteContactMessage = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await requireContactAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin
      .from('contact_messages' as never)
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true as const }
  })
