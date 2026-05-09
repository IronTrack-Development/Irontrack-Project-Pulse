import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = process.env.SCREENSHOT_OUT ?? "./screenshots";
mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE ?? "http://localhost:3030";

async function withMockData(page) {
  await page.route("**/api/projects", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "demo-1",
          name: "Riverside Medical Pavilion",
          project_number: "PM-2026-014",
          client_name: "Riverside Health",
          location: "Phoenix, AZ",
          status: "active",
          health_score: 78,
          target_finish_date: "2026-09-15",
          stats: {
            totalActivities: 412, lateActivities: 6, completeActivities: 188,
            completionPercent: 46, highRisks: 3, daysToCompletion: 128,
            nextMilestone: { activity_name: "Mech rough complete L3", finish_date: "2026-06-04" },
            todayActivity: { activity_name: "Ductwork rough-in - Level 3 east", trade: "HVAC" },
          },
        },
      ]),
    });
  });
  await page.route("**/api/notifications/check**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );
  await page.route("**/auth/v1/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: "demo" } }) })
  );
  await page.route("**/rest/v1/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
  );
}

const browser = await chromium.launch();

// 1. Mobile menu open (cream-themed, proves bug fix)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.click('button[aria-label="Open menu"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, "11-home-mobile-menu-open.png") });
  console.log("✓ 11-home-mobile-menu-open.png");
  await ctx.close();
}

// 2. Trust section (scrolled to)
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const h = Array.from(document.querySelectorAll("h2")).find((el) =>
      el.textContent && el.textContent.includes("Boring on purpose")
    );
    if (h) {
      const rect = h.getBoundingClientRect();
      window.scrollBy({ top: rect.top - 80, behavior: "instant" });
    }
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, "12-home-trust-section.png") });
  console.log("✓ 12-home-trust-section.png");
  await ctx.close();
}

// 3. GC dashboard with project SELECTED (shows inline today + Open button + active states)
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await withMockData(page);
  await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.selectOption("#dashboard-loop-project", "demo-1");
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, "13-gc-dashboard-project-selected.png") });
  console.log("✓ 13-gc-dashboard-project-selected.png");
  await ctx.close();
}

// 4. GC dashboard mobile, project selected
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await withMockData(page);
  await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.selectOption("#dashboard-loop-project", "demo-1");
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, "14-gc-dashboard-mobile-selected.png") });
  console.log("✓ 14-gc-dashboard-mobile-selected.png");
  await ctx.close();
}

await browser.close();
console.log("done");
