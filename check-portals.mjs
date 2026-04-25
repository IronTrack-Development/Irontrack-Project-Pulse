const SUPABASE_URL = 'https://cftckycnvxntldxnbiee.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdGNreWNudnhudGxkeG5iaWVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc5OTcwOCwiZXhwIjoyMDkwMzc1NzA4fQ.kv5YzKr5NFX12pr2lZOLbMUbaVSOYQtT2M4eE7p05E8';

// Get all jurisdictions
const res = await fetch(`${SUPABASE_URL}/rest/v1/jurisdictions?select=name,type,portal_url,portal_provider,phone&order=name`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  },
});
const data = await res.json();

const hasPortal = data.filter(j => j.portal_url);
const noPortal = data.filter(j => !j.portal_url);
const hasPhone = data.filter(j => j.phone);
const nothing = data.filter(j => !j.portal_url && !j.phone);

console.log(`Total: ${data.length}`);
console.log(`Has portal URL: ${hasPortal.length}`);
console.log(`No portal URL: ${noPortal.length}`);
console.log(`Has phone: ${hasPhone.length}`);
console.log(`No phone AND no portal: ${nothing.length}`);

console.log('\n=== NO PORTAL URL ===');
noPortal.forEach(j => console.log(`  ${j.name} (${j.type}) — phone: ${j.phone || 'NONE'}`));
