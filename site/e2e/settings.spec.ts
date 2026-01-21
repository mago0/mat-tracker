import { test, expect } from "./fixtures/test-utils";
import { login } from "./fixtures/test-utils";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("shows settings page with threshold configuration", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Stripe Thresholds")).toBeVisible();
    await expect(page.getByText("Belt Eligibility Thresholds")).toBeVisible();
  });

  test("shows stripe threshold inputs for all belts", async ({ page }) => {
    await page.goto("/settings");

    // Check for all belt stripe inputs by their IDs
    await expect(page.locator("#stripe-white")).toBeVisible();
    await expect(page.locator("#stripe-blue")).toBeVisible();
    await expect(page.locator("#stripe-purple")).toBeVisible();
    await expect(page.locator("#stripe-brown")).toBeVisible();
    await expect(page.locator("#stripe-black")).toBeVisible();
  });

  test("shows belt eligibility threshold inputs", async ({ page }) => {
    await page.goto("/settings");

    // Check for belt progression arrows (white -> blue, blue -> purple, etc.)
    await expect(page.getByText("White").first()).toBeVisible();
    await expect(page.getByText("Blue").first()).toBeVisible();
    await expect(page.getByText("Purple").first()).toBeVisible();
    await expect(page.getByText("Brown").first()).toBeVisible();
  });

  test("can save settings", async ({ page }) => {
    await page.goto("/settings");

    // Update a stripe threshold
    const whiteStripeInput = page.locator("#stripe-white");
    await whiteStripeInput.clear();
    await whiteStripeInput.fill("30");

    // Save settings
    await page.getByRole("button", { name: "Save Settings" }).click();

    // Should show success message
    await expect(page).toHaveURL(/saved=1/);
    await expect(page.getByText("Settings saved successfully")).toBeVisible();
  });

  test("persists saved values", async ({ page }) => {
    // First set a specific value
    await page.goto("/settings");
    const testValue = "42";
    const whiteStripeInput = page.locator("#stripe-white");
    await whiteStripeInput.clear();
    await whiteStripeInput.fill(testValue);
    await page.getByRole("button", { name: "Save Settings" }).click();
    await expect(page.getByText("Settings saved successfully")).toBeVisible();

    // Refresh and verify it persisted
    await page.goto("/settings");
    await expect(whiteStripeInput).toHaveValue(testValue);
  });

  test("can update belt eligibility threshold", async ({ page }) => {
    await page.goto("/settings");

    // Update a belt threshold
    const whiteBeltInput = page.locator("#belt-white");
    await whiteBeltInput.clear();
    await whiteBeltInput.fill("120");

    // Save settings
    await page.getByRole("button", { name: "Save Settings" }).click();

    // Should show success message
    await expect(page.getByText("Settings saved successfully")).toBeVisible();

    // Verify it persisted
    await page.goto("/settings");
    await expect(whiteBeltInput).toHaveValue("120");
  });
});
