const SUPABASE_URL = 'https://cftckycnvxntldxnbiee.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdGNreWNudnhudGxkeG5iaWVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc5OTcwOCwiZXhwIjoyMDkwMzc1NzA4fQ.kv5YzKr5NFX12pr2lZOLbMUbaVSOYQtT2M4eE7p05E8';

// Get count with prefer: count=exact
const res = await fetch(`${SUPABASE_URL}/rest/v1/jurisdictions?select=name,portal_url,portal_provider&portal_url=not.is.null&limit=200`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'count=exact',
    'Range': '0-199',
  }
});
const data = await res.json();
const contentRange = res.headers.get('content-range');
console.log('Content-Range:', contentRange);
console.log('Records returned:', data.length);

// Breakdown by provider
const byProvider = {};
for (const j of data) {
  const p = j.portal_provider || 'none';
  byProvider[p] = (byProvider[p] || 0) + 1;
}
console.log('By provider:', byProvider);

// Show the 90 we updated specifically
const ourNames = [
  'Apache County', 'City of Apache Junction', 'City of Avondale', 'City of Benson',
  'City of Yuma', 'Town of Sahuarita', 'Cochise County', 'Town of Fountain Hills',
  'City of Prescott', 'Town of Florence', 'Navajo County', 'Yavapai County'
];
const names = data.map(j => j.name);
console.log('\nSpot check of updated jurisdictions:');
ourNames.forEach(n => {
  const found = data.find(j => j.name === n);
  if (found) {
    console.log(`  ✓ ${n}: ${found.portal_url.substring(0, 60)}... [${found.portal_provider}]`);
  } else {
    console.log(`  ✗ MISSING: ${n}`);
  }
});

// Check for AZ jurisdictions still missing
const res2 = await fetch(`${SUPABASE_URL}/rest/v1/jurisdictions?select=name&portal_url=is.null&limit=50`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  }
});
const missing = await res2.json();
console.log(`\nJurisdictions still missing portal_url: ${missing.length}`);
if (missing.length > 0) {
  console.log('Missing:', missing.map(j => j.name).join(', '));
}
