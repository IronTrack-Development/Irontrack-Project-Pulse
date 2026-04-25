const SUPABASE_URL = 'https://cftckycnvxntldxnbiee.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdGNreWNudnhudGxkeG5iaWVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc5OTcwOCwiZXhwIjoyMDkwMzc1NzA4fQ.kv5YzKr5NFX12pr2lZOLbMUbaVSOYQtT2M4eE7p05E8';

// Check all buckets
console.log('=== All Buckets ===');
const bucketsRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  },
});
const buckets = await bucketsRes.json();
for (const b of buckets) {
  console.log(`  ${b.name}: public=${b.public}, file_size_limit=${b.file_size_limit}, mime_types=${JSON.stringify(b.allowed_mime_types)}`);
}

// Check drawings bucket specifically
console.log('\n=== Drawings Bucket Detail ===');
const drawRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket/drawings`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  },
});
const draw = await drawRes.json();
console.log(JSON.stringify(draw, null, 2));

// Try setting the limit to 500MB (524288000 bytes)
console.log('\n=== Updating drawings bucket to 500MB limit ===');
const updateRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket/drawings`, {
  method: 'PUT',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    public: true,
    fileSizeLimit: 524288000,
    allowedMimeTypes: ['application/pdf'],
  }),
});
const updateBody = await updateRes.text();
console.log(`Update result: ${updateRes.status} ${updateBody}`);

// Verify
const verifyRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket/drawings`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  },
});
const verify = await verifyRes.json();
console.log('\n=== After Update ===');
console.log(JSON.stringify(verify, null, 2));

// Check the global project upload limit
console.log('\n=== Checking global config ===');
const configRes = await fetch(`${SUPABASE_URL}/storage/v1/config`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  },
});
if (configRes.ok) {
  const config = await configRes.json();
  console.log(JSON.stringify(config, null, 2));
} else {
  console.log(`Config endpoint: ${configRes.status}`);
}
