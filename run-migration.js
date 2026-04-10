const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  console.log('Creating IronTrack Daily tables...\n')

  // Create tables one by one using Supabase insert/select to verify
  const tables = [
    'daily_projects',
    'schedule_uploads', 
    'parsed_activities',
    'daily_risks',
    'daily_briefs'
  ]

  // Test if tables exist by trying to select from them
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1)
    if (error && error.message.includes('does not exist')) {
      console.log(`❌ Table "${table}" does not exist — need to run SQL in Supabase editor`)
    } else if (error && error.code === '42501') {
      console.log(`⚠️  Table "${table}" exists but RLS blocking — need policies`)
    } else {
      console.log(`✅ Table "${table}" exists and accessible`)
    }
  }

  // Try creating via rpc if available
  const sql = fs.readFileSync(path.join(__dirname, 'src', 'migrations', '001_irontrack_daily.sql'), 'utf8')
  
  // Split into individual statements and try each
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 10)
  
  let success = 0
  let failed = 0
  
  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' })
      if (error) {
        // Try via REST - won't work for DDL, but let's see
        failed++
      } else {
        success++
      }
    } catch {
      failed++
    }
  }

  if (failed > 0) {
    console.log(`\n⚠️  Cannot run DDL via Supabase client (${failed} statements need SQL editor)`)
    console.log('\nPlease paste the migration SQL into:')
    console.log('https://supabase.com/dashboard/project/raxdqjivrathfornpxug/sql')
    console.log(`\nSQL file: ${path.join(__dirname, 'src', 'migrations', '001_irontrack_daily.sql')}`)
  }

  // Re-check tables
  console.log('\n--- Checking tables again ---')
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1)
    if (error) {
      console.log(`❌ ${table}: ${error.message}`)
    } else {
      console.log(`✅ ${table}: ready (${data.length} rows)`)
    }
  }
}

run()
