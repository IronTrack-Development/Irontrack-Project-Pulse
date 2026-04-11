# Upload Limits & Storage Quotas Implementation

## Summary

Added comprehensive upload limits and storage quotas to IronTrack Project Pulse to prevent abuse and manage resource usage.

## Changes Made

### 1. Database Migration (`src/migrations/004_upload_limits.sql`)

Created new tables:
- **`user_uploads`** - Tracks daily upload activity per user
- **`user_storage`** - Tracks total storage usage per user

Added database functions:
- `increment_daily_uploads(p_user_id, p_file_size)` - Atomic daily upload counter
- `increment_user_storage(p_user_id, p_file_size)` - Atomic storage tracker
- `decrement_user_storage(p_user_id, p_file_size)` - For future deletion feature

Includes RLS policies so users can only view their own stats.

### 2. Upload API Route (`src/app/api/upload/route.ts`)

Added limit checks (executed BEFORE file processing):
1. **File size**: 100MB max (up from 10MB)
2. **Daily uploads**: 50 files/day per user
3. **Monthly uploads**: 50 files/month per user
4. **Storage quota**: 500MB total per user

Added tracking (executed AFTER successful upload):
- Increments daily upload count
- Increments total storage usage

### 3. Settings Page (`src/app/settings/page.tsx`)

Completely rewrote settings page to show:
- Current storage usage with progress bar
- Color-coded warnings (green/yellow/red)
- File count
- Upload limits documentation
- Warning message when 80%+ full

## Limits Summary

| Limit | Value |
|-------|-------|
| Max file size | 100 MB |
| Hourly uploads | 10 files/hour (existing) |
| Daily uploads | 50 files/day |
| Monthly uploads | 50 files/month |
| Total storage | 500 MB/user |

## Migration Instructions

**IMPORTANT**: The migration SQL must be run manually in Supabase.

1. Run: `node show-migration.js` to display the SQL
2. Copy the SQL output
3. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
4. Paste and execute the SQL
5. Verify with:
   ```sql
   SELECT * FROM user_uploads LIMIT 1;
   SELECT * FROM user_storage LIMIT 1;
   ```

## Testing Checklist

- [ ] Run migration in Supabase SQL editor
- [ ] Upload a file and verify tracking works
- [ ] Check settings page shows correct storage usage
- [ ] Try uploading when at daily limit (should fail with 429)
- [ ] Try uploading when storage quota exceeded (should fail with 507)
- [ ] Verify large file (>100MB) is rejected with 413

## Future Enhancements

1. Add project deletion handler to call `decrement_user_storage()`
2. Add admin dashboard to view all users' storage usage
3. Add email notifications when approaching limits
4. Add paid tier with higher limits
5. Add cleanup job to remove old upload tracking records

## Files Modified

- `src/migrations/004_upload_limits.sql` (NEW)
- `src/app/api/upload/route.ts` (MODIFIED)
- `src/app/settings/page.tsx` (REWRITTEN)
- `show-migration.js` (NEW - utility script)
- `run-upload-limits-migration.js` (NEW - deprecated, use show-migration.js)

## Build Status

✅ Build successful
✅ TypeScript compilation passed
✅ No errors or warnings (except Next.js workspace root warning, which is expected)
