import { readFileSync, writeFileSync } from 'fs';

// Write results to a file instead of stdout to avoid PowerShell mangling
const results = [];

// Check HandoffTracker line 660
const c = readFileSync('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack-project-pulse\\src\\components\\sub-ops\\HandoffTracker.tsx', 'utf8');
const line660 = c.split('\n')[659];
results.push('HandoffTracker line 660 char codes:');
const interesting = line660.trim();
results.push('trimmed: ' + interesting);
results.push('length: ' + interesting.length);
results.push('charCodes: ' + [...interesting].map(ch => ch.charCodeAt(0)).join(','));

// Does it contain the literal string `: "#6B7280"`?
const search1 = ': "#6B7280"';
results.push('contains [: "#6B7280"]: ' + c.includes(search1));

// Check what the actual pattern is
const idx = c.indexOf('#6B7280');
if (idx >= 0) {
  const context = c.substring(idx - 40, idx + 20);
  results.push('context around first #6B7280: |' + context + '|');
  results.push('context charCodes: ' + [...context].map(ch => ch.charCodeAt(0)).join(','));
}

// Check report page
const r = readFileSync('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack-project-pulse\\src\\app\\projects\\[id]\\report\\page.tsx', 'utf8');
const ridx = r.indexOf('#1F1F25');
if (ridx >= 0) {
  const rctx = r.substring(ridx - 30, ridx + 20);
  results.push('');
  results.push('report page context around #1F1F25: |' + rctx + '|');
  results.push('charCodes: ' + [...rctx].map(ch => ch.charCodeAt(0)).join(','));
}

writeFileSync('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack-project-pulse\\check-results.txt', results.join('\n'), 'utf8');
console.log('Results written to check-results.txt');
