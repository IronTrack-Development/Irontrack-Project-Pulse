# Icon Replacement Guide — IronTrack Pulse

## Overview
This guide explains how to replace the current app icons with the new IronTrack Pulse branding (metallic "IT" monogram with orange glow border).

## Source Image
The new logo is in the marketing image Kevin provided. The IT logo icon is the square metallic monogram at the top of that image.

## Steps to Replace Icons

### 1. Extract the Logo Icon
1. Open the marketing image (with the IT monogram and "Run Your Job. Don't Chase It." tagline)
2. Crop **JUST the IT logo icon** — the square with:
   - Metallic "IT" letters
   - Dark background (#0B0B0D or similar)
   - Orange glow border (#F97316)
3. Save as a high-resolution square PNG (at least 1024x1024 recommended)

### 2. Generate All Icon Sizes
Use an online favicon generator to create all required sizes:

**Recommended tool:** https://realfavicongenerator.net/

1. Upload your cropped IT logo PNG
2. Configure settings:
   - iOS: Use the full square logo
   - Android: Use the full square logo
   - Desktop browsers: Generate multi-size ICO
3. Download the generated package

### 3. Replace Files in `public/`

Replace these files with the generated versions:

- **icon-192.png** (192×192) — Android, PWA
- **icon-512.png** (512×512) — Android, PWA, high-res
- **apple-touch-icon.png** (180×180) — iOS home screen
- **favicon.ico** (multi-size) — Browser tab icon

### 4. Optional: Replace Sidebar Logo

The sidebar currently references `/irontrack-logo.png`. You may want to create this file as well:
- Use the cropped IT logo icon
- Resize to approximately 256×256 or 512×512
- Place at `public/irontrack-logo.png`

## Current Files to Replace

All located in `public/`:

- ✅ `icon-192.png` — Currently placeholder/old branding
- ✅ `icon-512.png` — Currently placeholder/old branding  
- ✅ `apple-touch-icon.png` — Currently placeholder/old branding
- ✅ `favicon.ico` — Currently placeholder/old branding
- ⚠️ `irontrack-logo.png` — Referenced by Sidebar.tsx (may not exist yet)

## Verification

After replacing the files:

1. **Hard refresh** the app in your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check the browser tab — favicon should show the IT logo
3. Check iOS/Android home screen — icon should show the IT logo
4. Check the sidebar — logo should display correctly

## Technical Notes

- All icons use the same base logo (no need for different designs)
- Background color should match app theme: `#0B0B0D`
- Orange accent color: `#F97316`
- The logo is already optimized for dark backgrounds
- PWA manifest colors have been updated in `src/app/layout.tsx`

## Branding Assets Updated

✅ Theme color (viewport) → `#0B0B0D`  
✅ App description → "Run Your Job. Don't Chase It."  
✅ Landing page tagline → Added above hero  
⏳ Icons → **Pending manual replacement (this guide)**

---

**Next Steps:**
1. Crop the IT logo from the marketing image
2. Generate icons using realfavicongenerator.net
3. Replace the 4 files in `public/`
4. Commit and deploy
