import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1600 } });
await p.setContent(`<body style="margin:0"><div style="width:1600px;height:1600px;background:linear-gradient(135deg,#3B4FD8,#E11D48,#FACC15)"></div></body>`);
await p.screenshot({ path: "_big-photo.jpg", type: "jpeg", quality: 95 });
await b.close();
