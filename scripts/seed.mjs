// One-time seed script: pushes data/events.json into your Supabase "events" table.
// Usage:
//   1. Run supabase/schema.sql in the Supabase SQL editor first.
//   2. Create a .env file (see .env.example) with your project URL + SERVICE ROLE key
//      (service role, not anon — this script needs insert rights and bypasses RLS).
//   3. npm install
//   4. npm run seed

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment / .env file.')
  console.error('Get these from Supabase → Project Settings → API.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const events = JSON.parse(
  readFileSync(join(__dirname, '..', 'data', 'events.json'), 'utf-8')
)

console.log(`Seeding ${events.length} events into Supabase...`)

// Clear existing rows first so re-running this script is idempotent.
const { error: delError } = await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
if (delError) {
  console.error('Failed to clear existing events:', delError.message)
  process.exit(1)
}

const chunkSize = 100
for (let i = 0; i < events.length; i += chunkSize) {
  const chunk = events.slice(i, i + chunkSize)
  const { error } = await supabase.from('events').insert(chunk)
  if (error) {
    console.error(`Failed inserting rows ${i}-${i + chunk.length}:`, error.message)
    process.exit(1)
  }
  console.log(`  inserted ${i + chunk.length} / ${events.length}`)
}

console.log('Done. Your Supabase "events" table now mirrors data/events.json.')
