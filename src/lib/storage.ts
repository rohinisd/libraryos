import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type UploadResult = { url: string };

export interface FileStorage {
  upload(file: Buffer, opts: { folder: string; filename: string }): Promise<UploadResult>;
}

// Dev-only adapter: writes into /public/uploads so Next can serve it directly.
// Swap for Vercel Blob once that account exists — same `upload()` signature,
// just branch on process.env.BLOB_READ_WRITE_TOKEN in `storage` below.
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

export const storage: FileStorage = new LocalDiskStorage();
