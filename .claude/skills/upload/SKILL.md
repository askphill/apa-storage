---
name: upload
description: Upload files and videos to Cloudflare R2 storage. Use when user says "upload", "upload files", "upload video", "push to R2", "store files", or wants to upload assets to cloud storage.
---

# Upload to Cloudflare R2

Uploads files and videos to Cloudflare R2, organizes them in a timestamped folder, and generates a JSON manifest with all public URLs.

## Usage

When the user wants to upload files, determine what to upload:

1. **Specific files**: User provides file paths directly
2. **A folder**: User points to a directory — all files inside get uploaded
3. **Current context**: Files the user has been working with in conversation

## Steps

1. Confirm which files to upload with the user
2. Run the upload script:

```bash
cd /Users/tijsinternet/Developer/askphill/projects/gitbook && node scripts/upload.js <file1> [file2] [folder/] ...
```

3. Parse the output — the script prints a `---JSON---` delimiter followed by a JSON manifest
4. Report back the public URLs and manifest location to the user

## Output

The script creates:
- A folder in R2 named with the current timestamp (e.g., `20260408-143022/`)
- All files uploaded into that folder
- A JSON manifest (`20260408-143022.json`) in the same folder containing all URLs
- A local copy of the manifest in the current directory

## Setup Required

If the `.env` file is missing, tell the user they need to:

1. Go to Cloudflare Dashboard > R2 > Manage R2 API Tokens
2. Create an API token with read/write access
3. Create a bucket (e.g., `gitbook`)
4. Enable public access on the bucket (Settings > Public Access)
5. Copy `.env.example` to `.env` and fill in the values
6. Run `npm install`

## Example

```
> /upload screenshots/hero.png videos/demo.mp4

Uploading 2 file(s) to folder: 20260408-143022/

  hero.png ... done
  demo.mp4 ... done

Manifest: https://your-bucket.r2.dev/20260408-143022/20260408-143022.json

All URLs:
  https://your-bucket.r2.dev/20260408-143022/hero.png
  https://your-bucket.r2.dev/20260408-143022/demo.mp4
```
