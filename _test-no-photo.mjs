import { chromium } from "playwright";
const base = "https://libraryos-iota.vercel.app";
const b = await chromium.launch();
const p = await b.newPage();
const stamp = Date.now();

await p.goto(`${base}/login`);
await p.fill('input[name="identifier"]', "admin@libraryos.test");
await p.fill('input[name="password"]', "Password123!");
await p.click('button[type="submit"]');
await p.waitForURL(`${base}/dashboard`, { timeout: 45000 });

await p.goto(`${base}/students`);
await p.click('button:has-text("Add New")');
await p.waitForSelector('input[placeholder="e.g. John Doe"]', { timeout: 15000 });
await p.fill('input[placeholder="e.g. John Doe"]', `No Photo Student ${stamp}`);
await p.fill('input[placeholder="10 digit number"]', "9877777777");
await p.click('button:has-text("Continue to Schedule")');
await p.waitForTimeout(500);
await p.click('button:has-text("Continue to Review")');
await p.waitForTimeout(500);
await p.click('button:has-text("Create Student")');
await p.waitForTimeout(6000);
console.log("URL after submit (no photo):", p.url());
console.log("Succeeded (contains ?created=):", p.url().includes("created="));
await b.close();
