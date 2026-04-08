# Gitbook

Upload files and videos to Cloudflare R2 with timestamped folders and JSON manifests.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a Cloudflare R2 bucket:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > R2
   - Create a bucket (e.g., `gitbook`)
   - Enable **Public Access** under bucket Settings
   - Create an **API Token** with read/write permissions

3. Configure environment:
   ```bash
   cp .env.example .env
   # Fill in your R2 credentials
   ```

## Usage

### CLI

```bash
# Upload specific files
node scripts/upload.js photo.jpg video.mp4

# Upload a whole folder
node scripts/upload.js ./my-assets/
```

### Claude Code Skill

```
/upload photo.jpg video.mp4
```

## What happens

1. Creates a folder in R2 named with the current date/time (e.g., `20260408-143022/`)
2. Uploads all files into that folder
3. Creates a JSON manifest with the same timestamp containing all public URLs
4. Saves a local copy of the manifest

## Free tier limits (Cloudflare R2)

- 10 GB storage
- 10 million reads/month
- 1 million writes/month
- Zero egress fees
