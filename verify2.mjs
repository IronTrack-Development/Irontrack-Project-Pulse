import { readFileSync, writeFileSync } from 'fs';
const BASE = 'C:\\Users\\Iront\\.openclaw\\workspace\\irontrack-project-pulse\\src';

// Verify HandoffTracker has colons
const ht = readFileSync(BASE + '\\components\\sub-ops\\HandoffTracker.tsx', 'utf8');
const htIdx = ht.indexOf('#6B7280');
if (htIdx >= 0) {
  const ctx = ht.substring(htIdx - 25, htIdx + 15);
  const codes = [...ctx].map(c => c.charCodeAt(0)).join(',');
  const hasColon = codes.includes('58'); // 58 = ':'
  console.log('HandoffTracker context: ' + ctx.replace(/\n/g, '\\n'));
  console.log('Has colon: ' + hasColon);
}

// Verify report page has proper quotes
const rp = readFileSync(BASE + '\\app\\projects\\[id]\\report\\page.tsx', 'utf8');
const rpIdx = rp.indexOf('#1F1F25');
if (rpIdx >= 0) {
  const ctx = rp.substring(rpIdx - 5, rpIdx + 15);
  const codes = [...ctx].map(c => c.charCodeAt(0)).join(',');
  console.log('report page context codes: ' + codes);
  console.log('Has proper quotes (34): ' + codes.includes('34'));
}

// Verify globals.css has hardcoded colors (pre-migration state)
const css = readFileSync(BASE + '\\app\\globals.css', 'utf8');
console.log('globals.css has #0B0B0D: ' + css.includes('#0B0B0D'));
console.log('globals.css has var(--bg-primary) in html: ' + css.includes('background-color: var(--bg-primary)'));
