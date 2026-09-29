// Browser-only: shrinks a picked photo to a small JPEG before it's uploaded, so
// Vercel Blob's free 1 GB stretches across thousands of students instead of a
// few hundred. Runs in the student add/edit forms, not the ID card's one-off
// phone-picked photo (that one is never uploaded anywhere, so it doesn't matter).
export async function compressImageFile(
  file: File,
  { maxDimension = 640, quality = 0.82 }: { maxDimension?: number; quality?: number } = {},
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // unsupported/corrupt image — upload the original rather than block the user
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob || blob.size >= file.size) return file; // compression didn't actually help — keep original

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
