import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

export type UploadResult = { url: string };

export interface FileStorage {
  upload(file: Buffer, opts: { folder: string; filename: string }): Promise<UploadResult>;
}

// Dev-only adapter: writes into /public/uploads so Next can serve it directly.
// Used only when BLOB_READ_WRITE_TOKEN isn't set (i.e. no Vercel Blob store
// connected yet) — see `storage` below.
class LocalDiskStorage implements FileStorage {
  async upload(file: Buffer, opts: { folder: string; filename: string }): Promise<UploadResult> {
    const dir = path.join(process.cwd(), "public", "uploads", opts.folder);
    await mkdir(dir, { recursive: true });

    const ext = path.extname(opts.filename) || "";
    const safeName = `${randomUUID()}${ext}`;
    await writeFile(path.join(dir, safeName), file);

    return { url: `/uploads/${opts.folder}/${safeName}` };
  }
}

// Production adapter. `put()` reads BLOB_READ_WRITE_TOKEN from the environment
// itself — Vercel injects it automatically once a Blob store is connected to
// the project, nothing else to configure. Public access is fine here: these
// are student profile photos displayed in the app's own UI, not sensitive
// documents, and public URLs are what let the browser load them directly
// (cheaper and faster than proxying every image through a server function).
class VercelBlobStorage implements FileStorage {
  async upload(file: Buffer, opts: { folder: string; filename: string }): Promise<UploadResult> {
    const ext = path.extname(opts.filename) || "";
    const key = `${opts.folder}/${randomUUID()}${ext}`;
    const blob = await put(key, file, { access: "public", addRandomSuffix: false });
    return { url: blob.url };
  }
}

export const storage: FileStorage = process.env.BLOB_READ_WRITE_TOKEN
  ? new VercelBlobStorage()
  : new LocalDiskStorage();
