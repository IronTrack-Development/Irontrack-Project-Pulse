/**
 * One-time VAPID key generator for IronTrack Pulse web push notifications.
 * Run: node scripts/generate-vapid-keys.js
 *
 * Copy the output into your .env.local and Vercel environment variables.
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY is used client-side (safe to expose).
 * VAPID_PRIVATE_KEY must remain server-side only.
 */

const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n=== IronTrack Pulse VAPID Keys ===\n');
console.log('Add these to .env.local and Vercel environment variables:\n');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\n⚠️  VAPID_PRIVATE_KEY is secret — never commit it to source control.');
console.log('=================================\n');
