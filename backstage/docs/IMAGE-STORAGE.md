# Image Storage System for Warehouse Items

## Overview
The warehouse item images use a dual-storage approach to optimize performance:

## Storage Locations

### 1. Full-Resolution Images (File System)
- **Location**: `storage/app/public/items/` directory
- **Format**: Original format (JPEG, PNG, WebP, GIF)
- **Purpose**: Archive/backup of full-quality images
- **Database Field**: `items.image` (stores relative path like `items/xyz.jpg`)
- **Access**: Via `Storage::disk('public')->url($item->image)` or symlinked `/storage/items/xyz.jpg`

### 2. Compressed Thumbnails (Database)
- **Location**: `items.image_data` column (LONGTEXT in database)
- **Format**: Base64-encoded JPEG data URI
- **Dimensions**: Max 128x128 pixels (maintains aspect ratio)
- **Quality**: 100% JPEG compression
- **Purpose**: Fast page loading - embedded directly in HTML
- **Size**: Typically 3-8KB per thumbnail (vs 50-500KB for full images)

## Compression Status Tracking

### The `compressed` Column
- **Type**: Boolean (default: false)
- **Purpose**: Track which items have been successfully compressed
- **Set to `true`**: When thumbnail is successfully generated and stored
- **Set to `false`**: When compression fails or image is removed

### Use Cases
1. **Identify missing compressions**: Query `WHERE compressed = false AND image IS NOT NULL`
2. **Bulk reprocessing**: Use `items:regenerate-thumbnails` command
3. **Quality monitoring**: Use `items:check-compression` command to see stats

## Available Commands

### Check Compression Status
```bash
php artisan items:check-compression
```
Shows statistics about compressed vs uncompressed items.

### Regenerate Thumbnails
```bash
# Only process uncompressed items (default)
php artisan items:regenerate-thumbnails

# Reprocess all items (useful after quality changes)
php artisan items:regenerate-thumbnails --all
```

## Why This Approach?

### Benefits
1. **Fast Initial Load**: Thumbnails are embedded in JSON/HTML, no extra HTTP requests
2. **Bandwidth Savings**: 100% JPEG at 128x128 is ~95% smaller than full images
3. **Lazy Loading Ready**: Small thumbnails load quickly while page renders
4. **Full Resolution Available**: Original files preserved for downloads/zooming
5. **Database Trackable**: Can query compression status directly

### Trade-offs
- Database storage increases (3-8KB per item with image)
- Two copies of each image (but thumbnail is tiny)
- Requires GD library for image processing

## Migration History
- Initial: `image` and `image_data` columns created
- 2026-01-30: Added `compressed` boolean column for tracking

## Future Considerations
- Consider moving to cloud storage (S3, etc.) if storage grows large
- Could implement progressive JPEGs for better perceived load times
- WebP format could reduce size by another 20-30% (browser support needed)
