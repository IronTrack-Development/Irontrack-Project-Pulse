# Two-Step Upload Flow

## Overview

IronTrack Project Pulse uses a two-step upload flow to bypass Vercel's 4.5MB serverless function body size limit.

## How It Works

### Small Files (< 4MB)
For files under 4MB, the original direct upload flow is used for backwards compatibility:
1. Browser sends file directly to `/api/upload` via FormData
2. API route processes the file immediately
3. Results returned to user

### Large Files (≥ 4MB)
For files 4MB or larger, a two-step flow is used:
1. **Browser → Supabase Storage**: File is uploaded directly to Supabase Storage bucket `uploads`
   - Path: `{user_id}/{timestamp}-{filename}`
   - No size limit (Supabase Storage supports files up to 5GB on free tier)
   - Upload progress shown to user
2. **Browser → API**: Small JSON payload sent to `/api/upload` containing:
   - `storage_path`: Location of file in Supabase Storage
   - `project_id`: Project ID
   - `mapping`: Column mapping configuration
3. **API Processing**: 
   - Downloads file from Supabase Storage
   - Processes the file normally
   - Deletes the file from storage (cleanup)
   - Returns results

## Benefits

- ✅ Bypasses Vercel's 4.5MB body size limit
- ✅ Supports files up to 100MB (app limit)
- ✅ Backwards compatible with small files
- ✅ Auto-cleanup prevents storage bloat
- ✅ Progress indication for large uploads

## Setup

### Prerequisites
- Supabase project configured
- Environment variables set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Create Storage Bucket
Run the setup script to create the `uploads` bucket:

```bash
npx tsx --env-file=.env.local scripts/setup-storage-bucket.ts
```

This creates a private bucket called `uploads` for temporary file storage.

## File Flow Diagram

```
Small file (< 4MB):
Browser --[FormData]--> /api/upload --> Process --> Return results

Large file (≥ 4MB):
Browser --[File]--> Supabase Storage
Browser --[JSON {storage_path}]--> /api/upload --> Download from Storage --> Process --> Delete from Storage --> Return results
```

## Supported File Types

- `.xlsx` - Excel (recommended for best results)
- `.xls` - Legacy Excel
- `.csv` - Comma-separated values
- `.pdf` - PDF schedules (AI-powered parsing)
- `.mpp` - Microsoft Project (via MPXJ service)
- `.xer` - Primavera P6 (direct parsing)
- `.xml` - MS Project XML export (AI-powered parsing)

## Code Changes

### Modified Files
1. `src/app/upload/page.tsx` - Upload form with two-step flow logic
2. `src/app/api/upload/route.ts` - API route supporting both FormData and storage path
3. `scripts/setup-storage-bucket.ts` - Bucket creation script

### Key Functions

#### Upload Page (`page.tsx`)
```typescript
// Detect file size and choose upload method
const USE_TWO_STEP = file.size > 4 * 1024 * 1024;

if (USE_TWO_STEP) {
  // Upload to Supabase Storage first
  await supabase.storage.from('uploads').upload(storagePath, file);
  
  // Then call API with storage path
  await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storage_path: storagePath, ... })
  });
}
```

#### API Route (`route.ts`)
```typescript
// Support both FormData and JSON
if (contentType.includes('application/json')) {
  // Two-step flow: download from storage
  const { storage_path } = await req.json();
  const { data } = await supabase.storage.from('uploads').download(storage_path);
  // ... process ...
  // Cleanup
  await supabase.storage.from('uploads').remove([storage_path]);
} else {
  // Direct FormData flow
  const file = formData.get('file');
  // ... process ...
}
```

## Testing

1. **Small file test**: Upload a file < 4MB (e.g., small .xlsx)
   - Should use FormData flow
   - No storage upload
2. **Large file test**: Upload a file ≥ 4MB
   - Should show progress indicator
   - Uses Supabase Storage
   - File cleaned up after processing
3. **Error handling**: Test with invalid files
   - Storage cleanup on errors
   - Proper error messages

## Monitoring

Check Supabase Storage dashboard:
- Bucket `uploads` should remain empty (files deleted after processing)
- If files accumulate, indicates cleanup failure

## Troubleshooting

### "Storage upload failed"
- Check Supabase Storage is enabled
- Verify bucket `uploads` exists
- Check user permissions (RLS policies if enabled)

### "Failed to retrieve file from storage"
- File may have been deleted
- Check storage path format: `{user_id}/{timestamp}-{filename}`
- Verify service role key has storage permissions

### Build fails
Ensure TypeScript passes:
```bash
npx next build
```

## Future Improvements

- [ ] Implement resumable uploads for very large files
- [ ] Add upload progress percentage (requires chunked upload)
- [ ] Background processing for extremely large files
- [ ] Webhook notification when processing completes
