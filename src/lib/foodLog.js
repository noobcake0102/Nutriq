import { supa } from './supabase.js'

export async function loadFoodLogs(userId, date) {
  const { data } = await supa
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', date)
    .order('logged_at', { ascending: true })
  return data || []
}

export async function insertFoodLog(userId, entry) {
  const { data, error } = await supa.from('food_logs').insert({
    user_id:      userId,
    log_date:     entry.log_date,
    meal:         entry.meal,
    source:       entry.source || 'manual',
    barcode:      entry.barcode || null,
    name:         entry.name,
    serving_qty:  entry.serving_qty ?? 1,
    serving_unit: entry.serving_unit || 'serving',
    calories:     Math.round(entry.calories * (entry.serving_qty ?? 1)),
    protein_g:    Math.round(entry.protein_g * (entry.serving_qty ?? 1) * 10) / 10,
    carbs_g:      Math.round(entry.carbs_g * (entry.serving_qty ?? 1) * 10) / 10,
    fat_g:        Math.round(entry.fat_g * (entry.serving_qty ?? 1) * 10) / 10,
  }).select().single()
  if (error) throw error
  return data
}

export async function deleteFoodLog(id) {
  await supa.from('food_logs').delete().eq('id', id)
}

export async function loadDailyTargets(userId) {
  const { data } = await supa
    .from('daily_targets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function saveDailyTargets(userId, targets) {
  const { error } = await supa.from('daily_targets').upsert({
    user_id:    userId,
    calories:   targets.calories,
    protein_g:  targets.protein_g,
    carbs_g:    targets.carbs_g,
    fat_g:      targets.fat_g,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw error
}
