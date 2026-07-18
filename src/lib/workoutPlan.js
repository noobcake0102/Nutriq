import { supa } from './supabase.js'

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // ISO Monday
  return new Date(new Date().setDate(diff)).toISOString().split('T')[0]
}

export async function loadWorkoutProfile(userId) {
  const { data } = await supa.from('user_workout_profile').select('*').eq('user_id', userId).maybeSingle()
  return data
}

export async function saveWorkoutProfile(userId, profile) {
  await supa.from('user_workout_profile').upsert(
    { user_id: userId, ...profile, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
}

export async function loadCurrentPlan(userId) {
  const weekStart = getWeekStart()
  const { data } = await supa.from('workout_plans')
    .select('*').eq('user_id', userId).eq('week_start_date', weekStart)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  return data
}

export async function savePlan(userId, planJson) {
  const weekStart = getWeekStart()
  // Replace any existing plan for this week
  await supa.from('workout_plans').delete().eq('user_id', userId).eq('week_start_date', weekStart)
  const { data } = await supa.from('workout_plans')
    .insert({ user_id: userId, week_start_date: weekStart, plan_json: planJson })
    .select().single()
  return data
}

export async function loadLogs(userId, planId) {
  const { data } = await supa.from('workout_logs').select('*').eq('user_id', userId).eq('plan_id', planId)
  return data || []
}

export async function upsertLog(userId, planId, dayKey, completed, notes = '') {
  const { data: existing } = await supa.from('workout_logs').select('id')
    .eq('user_id', userId).eq('plan_id', planId).eq('day_key', dayKey).maybeSingle()
  if (existing) {
    await supa.from('workout_logs').update({
      completed, notes,
      completed_at: completed ? new Date().toISOString() : null,
    }).eq('id', existing.id)
    return { id: existing.id, day_key: dayKey, completed, notes }
  }
  const { data } = await supa.from('workout_logs').insert({
    user_id: userId, plan_id: planId, day_key: dayKey, completed, notes,
    completed_at: completed ? new Date().toISOString() : null,
  }).select().single()
  return data
}
