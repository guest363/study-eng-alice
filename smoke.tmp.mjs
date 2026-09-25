import { chromium } from "playwright";

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

const base = "http://localhost:5173";
for (const route of ["/", "/garden", "/party", "/parent", "/how-to-play", "/onboarding", "/region/mondstadt", "/session/mnd-q1-library"]) {
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  const heading = await page.locator("h1, h2, h3, .kicker").first().textContent().catch(() => null);
  const body = (await page.locator("body").innerText()).slice(0, 80).replace(/\n/g, " | ");
  console.log(`${route} → заголовок: ${heading?.trim().slice(0, 40)} · текст: ${body}`);
}
await page.goto(base, { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/tw-map.png", fullPage: false });
console.log("errors:", errors.length ? errors.slice(0, 5) : "нет");
await browser.close();
