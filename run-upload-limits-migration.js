const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  console.log('Running upload limits migration...\n')

  const sql = fs.readFileSync(path.join(__dirname, 'src', 'migrations', '004_upload_limits.sql'), 'utf8')
  
  console.log('⚠️  This migration creates new tables and functions.')
  console.log('   Please paste the SQL into the Supabase SQL editor:\n')
  console.log('   https://supabase.com/dashboard/project/raxdqjivrathfornpxug/sql\n')
  console.log('   Then press ENTER to verify tables exist...')
  
  // Wait for user input (simplified - just wait a bit)
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Check if tables exist
  console.log('\n--- Checking new tables ---')
  
  const tables = ['user_uploads', 'user_storage']
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1)
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`❌ ${table}: not found (migration not run yet)`)
      } else {
        console.log(`⚠️  ${table}: ${error.message}`)
      }
    } else {
      console.log(`✅ ${table}: ready`)
    }
  }

  console.log('\n--- SQL to paste into Supabase ---\n')
  console.log(sql)
}

run()
