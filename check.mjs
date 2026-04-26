import { readFileSync } from 'fs';

// Check HandoffTracker
const c = readFileSync('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack-project-pulse\\src\\components\\sub-ops\\HandoffTracker.tsx', 'utf8');
const lines = c.split('\n');
console.log('Line 659 JSON:', JSON.stringify(lines[658]));
console.log('Line 660 JSON:', JSON.stringify(lines[659]));
console.log('Contains ": \\"#6B7280\\"" :', c.includes(': "#6B7280"'));
console.log('Contains "cfg.color : \\"#6B7280\\"" :', c.includes('cfg.color : "#6B7280"'));

// Check report page
const r = readFileSync('C:\\Users\\Iront\\.openclaw\\workspace\\irontrack-project-pulse\\src\\app\\projects\\[id]\\report\\page.tsx', 'utf8');
const rlines = r.split('\n');
for (let i = 408; i < 416; i++) {
  console.log('report L' + (i+1) + ' JSON:', JSON.stringify(rlines[i]));
}
