// Re-classify Encanto set by calling the deployed classify endpoint
// Need to wait for Vercel deploy first, so let's call it via the production URL

const PROJECT_ID = '95818a65-0d17-42ba-a04d-7698ff6fdff7'; // Encanto project
const SET_ID = 'c4989230-ebfb-4a86-8a20-66cc548270a4';

// Try calling the Vercel-deployed endpoint
// First, find the actual domain
const SUPABASE_URL = 'https://cftckycnvxntldxnbiee.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdGNreWNudnhudGxkeG5iaWVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc5OTcwOCwiZXhwIjoyMDkwMzc1NzA4fQ.kv5YzKr5NFX12pr2lZOLbMUbaVSOYQtT2M4eE7p05E8';

// First reset all sheets back to unclassified so the API reclassifies them
console.log('Resetting all sheets to unclassified...');
const resetSql = `
UPDATE drawing_sheets 
SET discipline = 'general', sheet_number = 'P' || (page_index + 1), sheet_title = 'Page ' || (page_index + 1)
WHERE set_id = '${SET_ID}';
`;

const resetRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  },
  body: JSON.stringify({ sql_text: resetSql }),
});
console.log(`Reset: ${resetRes.ok ? '✅' : '❌'}`);

// Now we need to call the classify endpoint on the deployed app
// Kevin's app domain - let's try irontrackpulse.com
const domains = [
  'https://irontrackpulse.com',
  'https://irontrack-pulse.vercel.app',
  'https://www.irontrackpulse.com',
];

for (const domain of domains) {
  console.log(`\nTrying ${domain}...`);
  try {
    const res = await fetch(`${domain}/api/projects/${PROJECT_ID}/drawings/${SET_ID}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(300000), // 5 min timeout
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Classification complete!');
      console.log(JSON.stringify(data, null, 2));
      break;
    } else {
      const err = await res.text();
      console.log(`${res.status}: ${err.substring(0, 200)}`);
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}
