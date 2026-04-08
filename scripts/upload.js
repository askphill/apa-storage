#!/usr/bin/env node

/**
 * Upload files/videos to Cloudflare R2.
 *
 * Usage:
 *   node scripts/upload.js <file1> [file2] [file3] ...
 *   node scripts/upload.js path/to/folder/
 *
 * Creates a timestamped folder in R2, uploads all files into it,
 * then writes a JSON manifest (same timestamp name) with all URLs.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve, extname } from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import mime from "mime-types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const required = (key) => {
  const val = process.env[key];
  if (!val) {
    console.error(`Missing env var: ${key}  (see .env.example)`);
    process.exit(1);
  }
  return val;
};

const ACCOUNT_ID = required("R2_ACCOUNT_ID");
const ACCESS_KEY_ID = required("R2_ACCESS_KEY_ID");
const SECRET_ACCESS_KEY = required("R2_SECRET_ACCESS_KEY");
const BUCKET = required("R2_BUCKET_NAME");
const PUBLIC_URL = required("R2_PUBLIC_URL").replace(/\/+$/, "");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

function collectFiles(args) {
  const files = [];
  for (const arg of args) {
    const resolved = resolve(arg);
    const stat = statSync(resolved);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(resolved)) {
        const full = join(resolved, entry);
        if (statSync(full).isFile() && !entry.startsWith(".")) {
          files.push(full);
        }
      }
    } else if (stat.isFile()) {
      files.push(resolved);
    }
  }
  return files;
}

async function uploadFile(localPath, r2Key) {
  const body = readFileSync(localPath);
  const contentType = mime.lookup(localPath) || "application/octet-stream";

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `${PUBLIC_URL}/${r2Key}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: node scripts/upload.js <file|folder> ...");
    process.exit(1);
  }

  const files = collectFiles(args);
  if (files.length === 0) {
    console.error("No files found to upload.");
    process.exit(1);
  }

  const ts = timestamp();
  const folder = ts;

  console.log(`Uploading ${files.length} file(s) to folder: ${folder}/\n`);

  const manifest = {
    timestamp: ts,
    uploaded_at: new Date().toISOString(),
    folder: `${PUBLIC_URL}/${folder}/`,
    files: [],
  };

  for (const file of files) {
    const name = basename(file);
    const key = `${folder}/${name}`;
    process.stdout.write(`  ${name} ... `);
    const url = await uploadFile(file, key);
    console.log("done");
    manifest.files.push({
      name,
      url,
      size: statSync(file).size,
      type: mime.lookup(file) || "application/octet-stream",
    });
  }

  // Upload the manifest JSON itself into the same folder
  const manifestKey = `${folder}/${ts}.json`;
  const manifestBody = JSON.stringify(manifest, null, 2);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: manifestKey,
      Body: manifestBody,
      ContentType: "application/json",
    })
  );

  const manifestUrl = `${PUBLIC_URL}/${manifestKey}`;
  manifest.manifest_url = manifestUrl;

  // Also save manifest locally
  const localManifest = `${ts}.json`;
  writeFileSync(localManifest, JSON.stringify(manifest, null, 2));

  console.log(`\nManifest: ${manifestUrl}`);
  console.log(`Local copy: ${localManifest}`);
  console.log(`\nAll URLs:`);
  for (const f of manifest.files) {
    console.log(`  ${f.url}`);
  }

  // Output JSON to stdout for programmatic use
  return manifest;
}

const result = await main();
// Print machine-readable JSON at the very end (after human-readable output)
console.log(`\n---JSON---`);
console.log(JSON.stringify(result));
