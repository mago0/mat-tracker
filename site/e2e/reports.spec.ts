import { test, expect } from "./fixtures/test-utils";
import { login } from "./fixtures/test-utils";

test.describe("Reports", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe("Attendance Reports", () => {
    test("shows attendance reports page with stats", async ({ page }) => {
      await page.goto("/reports");
      await expect(
        page.getByRole("heading", { name: "Attendance Reports" })
      ).toBeVisible();

      // Check stats cards are visible
      await expect(page.getByText("Total Check-ins (1 year)")).toBeVisible();
      await expect(page.getByText("Average per Week")).toBeVisible();
      await expect(page.getByText("Busiest Day")).toBeVisible();
    });

    test("shows attendance heatmap", async ({ page }) => {
      await page.goto("/reports");
      await expect(
        page.getByText("Attendance Over the Past Year")
      ).toBeVisible();
    });

    test("shows inactive students section", async ({ page }) => {
      await page.goto("/reports");
      await expect(
        page.getByText("Inactive Students (30+ days)")
      ).toBeVisible();
    });

    test("can navigate to promotions report", async ({ page }) => {
      await page.goto("/reports");
      await page.getByRole("link", { name: "Promotion Status" }).click();
      await expect(page).toHaveURL("/reports/promotions");
    });
  });

  test.describe("Promotions Report", () => {
    test("shows promotions report page with stats", async ({ page }) => {
      await page.goto("/reports/promotions");
      await expect(
        page.getByRole("heading", { name: "Promotion Status" })
      ).toBeVisible();

      // Check stats cards are visible
      await expect(page.locator("dt", { hasText: "Total Active Students" })).toBeVisible();
      await expect(page.locator("dt", { hasText: "Due for Stripe" })).toBeVisible();
      await expect(page.locator("dt", { hasText: "Eligible for Belt" })).toBeVisible();
    });

    test("shows link to adjust thresholds", async ({ page }) => {
      await page.goto("/reports/promotions");
      await expect(
        page.getByRole("link", { name: "Adjust thresholds" })
      ).toBeVisible();
    });

    test("can navigate to settings from promotions report", async ({ page }) => {
      await page.goto("/reports/promotions");
      await page.getByRole("link", { name: "Adjust thresholds" }).click();
      await expect(page).toHaveURL("/settings");
    });

    test("shows students in promotions table", async ({ page }) => {
      // Create a student first
      await page.goto("/students/new");
      const uniqueName = `PromoReport${Date.now()}`;
      await page.getByLabel("First Name *").fill(uniqueName);
      await page.getByLabel("Last Name *").fill("Test");
      await page.getByRole("button", { name: "Add Student" }).click();

      // Go to promotions report
      await page.goto("/reports/promotions");

      // Should see the student in the table
      await expect(page.getByText(`${uniqueName} Test`)).toBeVisible();
    });
  });
});
