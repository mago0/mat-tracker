import { test as base, expect, Page } from "@playwright/test";

const TEST_PASSWORD = process.env.ADMIN_PASSWORD || "test-password";

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("/");
}

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect };
