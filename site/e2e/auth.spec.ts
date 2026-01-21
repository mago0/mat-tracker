import { test, expect } from "@playwright/test";
import { login } from "./fixtures/test-utils";

const TEST_PASSWORD = process.env.ADMIN_PASSWORD || "test-password";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/students");
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });

  test("shows error on invalid password", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Invalid password")).toBeVisible();
  });

  test("successful login redirects to home", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Mat Tracker")).toBeVisible();
  });

  test("successful login redirects to intended page", async ({ page }) => {
    await page.goto("/students");
    await expect(page).toHaveURL(/\/login\?redirect=/);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL("/students");
  });

  test("session persists across navigation", async ({ page }) => {
    await login(page);
    await page.goto("/students");
    await expect(page).toHaveURL("/students");
    await page.goto("/attendance");
    await expect(page).toHaveURL("/attendance");
    await page.goto("/reports");
    await expect(page).toHaveURL("/reports");
  });
});
