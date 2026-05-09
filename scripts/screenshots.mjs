import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = process.env.SCREENSHOT_OUT ?? "./screenshots";
mkdirSync(OUT, { recursive: true });

const BASE = process.env.BASE ?? "http://localhost:3030";

const SHOTS = [
  // public homepage
  { url: "/", name: "01-home-desktop-hero", viewport: { width: 1440, height: 900 }, fullPage: false, theme: null },
  { url: "/", name: "02-home-desktop-full", viewport: { width: 1440, height: 900 }, fullPage: true, theme: null },
  { url: "/", name: "03-home-mobile-hero", viewport: { width: 390, height: 844 }, fullPage: false, theme: null },
  { url: "/", name: "04-home-mobile-full", viewport: { width: 390, height: 844 }, fullPage: true, theme: null },

  // dashboards (will hit empty/auth state since we have no Supabase, but the loading/empty UI is still part of the polish)
  { url: "/dashboard", name: "05-gc-dashboard-desktop", viewport: { width: 1440, height: 900 }, fullPage: false, theme: "dark" },
  { url: "/dashboard", name: "06-gc-dashboard-mobile", viewport: { width: 390, height: 844 }, fullPage: false, theme: "dark" },
  { url: "/sub/dashboard", name: "07-sub-dashboard-desktop", viewport: { width: 1440, height: 900 }, fullPage: false, theme: "dark" },
  { url: "/sub/dashboard", name: "08-sub-dashboard-mobile", viewport: { width: 390, height: 844 }, fullPage: false, theme: "dark" },

  // login (cream/auth surface - no auth needed)
  { url: "/login", name: "09-login-desktop", viewport: { width: 1440, height: 900 }, fullPage: false, theme: null },
  { url: "/login", name: "10-login-mobile", viewport: { width: 390, height: 844 }, fullPage: false, theme: null },
];

async function withMockData(page) {
  // Stub the projects API so the GC dashboard renders the populated state, exercising the new "Run The Day" panel.
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
            totalActivities: 412,
            lateActivities: 6,
            completeActivities: 188,
            completionPercent: 46,
            highRisks: 3,
            daysToCompletion: 128,
            nextMilestone: { activity_name: "Mech rough complete L3", finish_date: "2026-06-04" },
            todayActivity: { activity_name: "Ductwork rough-in - Level 3 east", trade: "HVAC" },
          },
        },
        {
          id: "demo-2",
          name: "Central Office Tower",
          project_number: "PM-2026-021",
          client_name: "Skyline Properties",
          location: "Mesa, AZ",
          status: "active",
          health_score: 91,
          target_finish_date: "2026-12-20",
          stats: {
            totalActivities: 612,
            lateActivities: 1,
            completeActivities: 90,
            completionPercent: 15,
            highRisks: 1,
            daysToCompletion: 224,
            nextMilestone: { activity_name: "Foundations complete", finish_date: "2026-06-12" },
            todayActivity: { activity_name: "Concrete pour - Pad B", trade: "Concrete" },
          },
        },
        {
          id: "demo-3",
          name: "Avondale K-8 School",
          project_number: "PM-2026-007",
          client_name: "Avondale USD",
          location: "Avondale, AZ",
          status: "active",
          health_score: 64,
          target_finish_date: "2026-08-01",
          stats: {
            totalActivities: 318,
            lateActivities: 12,
            completeActivities: 220,
            completionPercent: 69,
            highRisks: 5,
            daysToCompletion: 84,
            nextMilestone: { activity_name: "MEP rough-in done", finish_date: "2026-05-28" },
            todayActivity: { activity_name: "Drywall hang - Wing C", trade: "Drywall" },
          },
        },
      ]),
    });
  });

  // Sub dashboard mock
  await page.route("**/api/sub/dashboard", async (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        company: {
          id: "sub-1",
          company_name: "Atlas Mechanical Systems",
          contact_name: "Marco Rivera",
          contact_email: "marco@atlasmech.example",
        },
        projects: [
          {
            sub_id: "sub-proj-1",
            project_id: "demo-1",
            project_name: "Riverside Medical Pavilion",
            location: "Phoenix, AZ",
            sub_name: "Atlas Mechanical Systems",
            trades: ["HVAC", "Piping", "Controls"],
            tasks_count: 84,
            last_report_date: "2026-05-08",
            last_report_by: "J. Ramirez",
            avg_percent: 64,
            report_count: 21,
          },
          {
            sub_id: "sub-proj-2",
            project_id: "demo-2",
            project_name: "Central Office Tower",
            location: "Mesa, AZ",
            sub_name: "Atlas Mechanical Systems",
            trades: ["HVAC", "Sheet Metal"],
            tasks_count: 38,
            last_report_date: null,
            last_report_by: null,
            avg_percent: 0,
            report_count: 0,
          },
        ],
        recentReports: [
          {
            id: "r1",
            report_date: "2026-05-08",
            submitted_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
            submitted_by: "J. Ramirez",
            project_id: "demo-1",
            project_name: "Riverside Medical Pavilion",
            manpower_count: 7,
            total_hours: 56,
            delay_reasons: [],
            notes: "Ductwork install ahead of plan on east riser. No blockers.",
            worked_on_activities: [{ activity_id: "a1", status: "65" }, { activity_id: "a2", status: "40" }],
          },
          {
            id: "r2",
            report_date: "2026-05-07",
            submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
            submitted_by: "D. Chen",
            project_id: "demo-1",
            project_name: "Riverside Medical Pavilion",
            manpower_count: 6,
            total_hours: 48,
            delay_reasons: ["Material delay"],
            notes: "Flex duct ETA Wednesday — paused at riser 4.",
            worked_on_activities: [{ activity_id: "a1", status: "60" }],
          },
        ],
        stats: {
          activeProjects: 2,
          reportsThisWeek: 3,
          uniqueForemen: 2,
        },
        totalReports: 21,
      }),
    });
  });

  // The dashboard makes a /api/notifications/check fire-and-forget — stub to silence
  await page.route("**/api/notifications/check**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
  );

  // Stub the supabase auth getUser call used by the dashboard to redirect sub users.
  // The browser-side supabase client will hit the placeholder URL; intercept any /auth/v1 request
  await page.route("**/auth/v1/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: { id: "demo-user" }, session: null }),
    })
  );

  await page.route("**/rest/v1/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
  );
}

const browser = await chromium.launch();
for (const shot of SHOTS) {
  const ctx = await browser.newContext({ viewport: shot.viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await withMockData(page);

  if (shot.theme) {
    // pre-set theme into localStorage before any client JS runs
    await ctx.addInitScript((theme) => {
      try { localStorage.setItem("pulse_theme", theme); } catch {}
    }, shot.theme);
  }

  try {
    await page.goto(BASE + shot.url, { waitUntil: "networkidle", timeout: 20000 });
  } catch (e) {
    console.error("nav timeout for", shot.url, e.message);
  }
  await page.waitForTimeout(1500);

  const file = join(OUT, `${shot.name}.png`);
  await page.screenshot({ path: file, fullPage: shot.fullPage });
  console.log("✓", file);
  await ctx.close();
}
await browser.close();
console.log("done");
