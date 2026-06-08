import { createClient } from '@supabase/supabase-js'

const SUPA_URL = 'https://lefzeekulgswdezozhcm.supabase.co'
const SUPA_KEY = 'sb_publishable_0-JLi16Gc3MePWi_lrdMSA_ux_HD0ES'

export const supa = createClient(SUPA_URL, SUPA_KEY)
