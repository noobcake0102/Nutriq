import { FD } from './lib/barcode.js'

export const NOW = Date.now()

export const SP = [
  { id: 'p1', ...FD['021130126026'], qty: 1, unit: 'gallon', added: NOW - 2 * 864e5, expiry: NOW + 5 * 864e5, by: 'Alex' },
  { id: 'p2', ...FD['036800401556'], qty: 2, unit: 'dozen', added: NOW - 864e5, expiry: NOW + 10 * 864e5, by: 'Alex' },
  { id: 'p3', ...FD['024000163756'], qty: 2, unit: 'lbs', added: NOW, expiry: NOW + 3 * 864e5, by: 'Jordan' },
  { id: 'p4', ...FD['070038640844'], qty: 4, unit: 'cups', added: NOW, expiry: NOW + 7 * 864e5, by: 'Alex' },
  { id: 'p5', ...FD['041497026135'], qty: 1, unit: 'bag', added: NOW, expiry: null, by: 'Jordan' },
  { id: 'p6', ...FD['041497014132'], qty: 3, unit: 'boxes', added: NOW, expiry: null, by: 'Alex' },
  { id: 'p7', ...FD['038000138416'], qty: 1, unit: 'box', added: NOW - 5 * 864e5, expiry: NOW + 60 * 864e5, by: 'Jordan' },
]

export const DG = {
  weight: 150, goalWeight: 135, height: 65, age: 34, sex: 'female',
  activity: 'moderate', goalType: 'lose', diet: 'balanced',
  allergies: [], householdSize: 2, meal_cuisines: [], meal_preferences: {},
}

export const CUISINES = ['Italian','Mexican','Asian','Mediterranean','American','Indian','Middle Eastern','Greek','Japanese','Thai','French','Healthy']

export const MEAL_TYPES = ['Breakfast','Quick Breakfast','Lunch','Meal Prep Lunch','Dinner','Quick Dinner','Snack','Smoothie']

export const MEAL_TYPE_LABELS = {
  'Breakfast': 'breakfast', 'Quick Breakfast': 'quick_breakfast',
  'Lunch': 'lunch', 'Meal Prep Lunch': 'meal_prep_lunch',
  'Dinner': 'dinner', 'Quick Dinner': 'quick_dinner',
  'Snack': 'snack', 'Smoothie': 'smoothie',
}

export const du = d => d ? Math.ceil((d - Date.now()) / 864e5) : null
export const uc = d => d === null ? null : d <= 2 ? '#b5344a' : d <= 5 ? '#c2780a' : d <= 10 ? '#c9a227' : '#7a9e6e'
