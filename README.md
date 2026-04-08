# APA Storage

Cloud file and video storage for APA projects, powered by Cloudflare R2. Upload any file or folder, get back public URLs organized in timestamped folders with a JSON manifest.

## How it works

```
you pass files ──> upload script ──> Cloudflare R2 bucket
                                          │
                                          ├── 20260408-151915/
                                          │   ├── hero.png
                                          │   ├── demo.mp4
                                          │   └── 20260408-151915.json  ← manifest
                                          │
                                          └── 20260410-093200/
                                              ├── screenshot.png
                                              └── 20260410-093200.json  ← manifest
```

Each upload creates a **timestamped folder** (format: `YYYYMMDD-HHMMSS`). All files go in that folder along with a **JSON manifest** containing public URLs, file sizes, and MIME types.

## Setup

### 1. Clone and install

```bash
git clone https://github.com/askphill/apa-storage.git
cd apa-storage
npm install
```

### 2. Configure credentials

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_api_token_access_key
R2_SECRET_ACCESS_KEY=your_r2_api_token_secret_key
R2_BUCKET_NAME=apa-storage
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### Where to find these values

| Value | Where |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare Dashboard URL: `dash.cloudflare.com/<this-part>/r2/overview` |
| `R2_ACCESS_KEY_ID` | R2 > Manage R2 API Tokens > Create API Token |
| `R2_SECRET_ACCESS_KEY` | Shown once when creating the API token |
| `R2_BUCKET_NAME` | The name you gave your bucket |
| `R2_PUBLIC_URL` | R2 > Bucket > Settings > Public Development URL |

### 3. Create the R2 bucket (if not done)

Using the Cloudflare CLI:

```bash
wrangler r2 bucket create apa-storage
wrangler r2 bucket dev-url enable apa-storage
```

Or via the Cloudflare Dashboard: R2 > Create Bucket > enable Public Access in Settings.

## Usage

### CLI

```bash
# Upload specific files
node --env-file=.env scripts/upload.js photo.jpg video.mp4

# Upload everything in a folder
node --env-file=.env scripts/upload.js ./assets/

# Mix files and folders
node --env-file=.env scripts/upload.js hero.png ./videos/ document.pdf
```

### Claude Code skill

From any Claude Code session (in this project directory):

```
/upload photo.jpg video.mp4
/upload ./my-folder/
```

### npm script

```bash
npm run upload -- photo.jpg video.mp4
```

## Output

### Console output

```
Uploading 2 file(s) to folder: 20260408-151915/

  hero.png ... done
  demo.mp4 ... done

Manifest: https://pub-xxxxx.r2.dev/20260408-151915/20260408-151915.json
Local copy: 20260408-151915.json

All URLs:
  https://pub-xxxxx.r2.dev/20260408-151915/hero.png
  https://pub-xxxxx.r2.dev/20260408-151915/demo.mp4
```

### JSON manifest

A manifest is saved both in R2 and locally. Structure:

```json
{
  "timestamp": "20260408-151915",
  "uploaded_at": "2026-04-08T13:19:15.671Z",
  "folder": "https://pub-xxxxx.r2.dev/20260408-151915/",
  "files": [
    {
      "name": "hero.png",
      "url": "https://pub-xxxxx.r2.dev/20260408-151915/hero.png",
      "size": 245120,
      "type": "image/png"
    },
    {
      "name": "demo.mp4",
      "url": "https://pub-xxxxx.r2.dev/20260408-151915/demo.mp4",
      "size": 8432100,
      "type": "video/mp4"
    }
  ],
  "manifest_url": "https://pub-xxxxx.r2.dev/20260408-151915/20260408-151915.json"
}
```

## Supported file types

Any file type works. Common ones:

- **Images**: png, jpg, gif, svg, webp
- **Video**: mp4, mov, webm, avi
- **Documents**: pdf, docx, xlsx
- **Other**: zip, json, csv, anything else

MIME types are detected automatically from file extensions.

## Project structure

```
apa-storage/
├── scripts/
│   └── upload.js          # Upload script (Node.js, uses AWS S3 SDK)
├── .claude/
│   └── skills/
│       └── upload/
│           └── SKILL.md   # Claude Code skill definition
├── .env.example           # Template for credentials
├── .env                   # Your credentials (gitignored)
├── package.json
└── README.md
```

## Why Cloudflare R2

- **Free tier**: 10 GB storage, 10M reads, 1M writes per month
- **Zero egress fees**: No charges for downloading files, unlike AWS S3
- **S3-compatible**: Uses standard AWS SDK, easy to integrate
- **Global CDN**: Files served from Cloudflare's edge network
- **Public URLs**: Direct file access without authentication
