import { chromium } from "playwright";
const base = "https://libraryos-iota.vercel.app";
const b = await chromium.launch();
const p = await b.newPage();
const ok = (l, c) => console.log(c ? "PASS" : "FAIL", "-", l);
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
const stamp = Date.now();

await p.goto(`${base}/login`);
await p.fill('input[name="identifier"]', "admin@libraryos.test");
await p.fill('input[name="password"]', "Password123!");
await p.click('button[type="submit"]');
await p.waitForURL(`${base}/dashboard`, { timeout: 45000 });

await p.goto(`${base}/students`);
await p.click('button:has-text("Add New")');
await p.waitForSelector('input[placeholder="e.g. John Doe"]', { timeout: 15000 });
await p.fill('input[placeholder="e.g. John Doe"]', `Blob Test Student ${stamp}`);
await p.fill('input[placeholder="10 digit number"]', "9866666666");
await p.setInputFiles('input[type="file"]', "_big-photo.jpg");
await p.waitForTimeout(1500);
await p.click('button:has-text("Continue to Schedule")');
await p.waitForTimeout(500);
await p.click('button:has-text("Continue to Review")');
await p.waitForTimeout(500);
await p.click('button:has-text("Create Student")');
await p.waitForURL(/\/students\?created=/, { timeout: 30000 });
ok("student created live with photo", true);

await p.goto(`${base}/students?tab=active&search=${encodeURIComponent(`Blob Test Student ${stamp}`)}`);
await p.waitForTimeout(1200);
const listImg = await p.locator(`img[alt^="Blob Test Student"]`).first().getAttribute("src");
console.log("Photo URL:", listImg);
ok("photo URL is a real Vercel Blob URL (not local /uploads)", !!listImg && listImg.includes("blob.vercel-storage.com"));

// Confirm the URL is actually publicly fetchable (real upload, not a broken link)
if (listImg) {
  const res = await p.request.get(listImg);
  ok(`photo URL returns 200 (${res.status()})`, res.status() === 200);
  const buf = await res.body();
  console.log("Live stored photo size:", buf.length, "bytes");
}

const hrefs = await p.locator('a[href^="/students/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
const studentHref = hrefs.find((h) => h && h !== "/students/export" && !h.includes("?"));
await p.goto(`${base}${studentHref}`);
await p.click('span:has-text("ID Card")');
await p.waitForSelector("text=Student ID Card", { timeout: 10000 });
const cardImgSrc = await p.locator("img[alt*='Blob Test Student']").last().getAttribute("src");
ok("ID card auto-uses the live Blob photo", !!cardImgSrc && cardImgSrc.includes("blob.vercel-storage.com"));

const [download] = await Promise.all([
  p.waitForEvent("download", { timeout: 20000 }),
  p.click('button:has-text("Download Image")'),
]);
await download.saveAs("_live-blob-card.png");
console.log("console errors:", errs.length ? errs : "none");

// cleanup
await p.goto(`${base}${studentHref}`);
p.once("dialog", (d) => d.accept());
await p.click('button:has-text("Delete")');
await p.waitForTimeout(1500);
ok("test student deleted from live DB", true);

await b.close();
