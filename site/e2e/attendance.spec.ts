import { test, expect } from "./fixtures/test-utils";
import { login } from "./fixtures/test-utils";

test.describe("Attendance", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("shows attendance page with filters", async ({ page }) => {
    await page.goto("/attendance");
    await expect(
      page.getByRole("heading", { name: "Attendance" })
    ).toBeVisible();
    await expect(page.getByLabel("Date")).toBeVisible();
    await expect(page.getByLabel("Class Type")).toBeVisible();
    await expect(page.getByText(/\d+ of \d+ checked in/)).toBeVisible();
  });

  test("can check in a student", async ({ page }) => {
    // First create a student to check in
    await page.goto("/students/new");
    const uniqueName = `Checkin${Date.now()}`;
    await page.getByLabel("First Name *").fill(uniqueName);
    await page.getByLabel("Last Name *").fill("Test");
    await page.getByRole("button", { name: "Add Student" }).click();
    await expect(page).toHaveURL("/students");

    // Go to attendance page
    await page.goto("/attendance");

    // Find the student and check them in
    const studentRow = page.locator("li").filter({ hasText: `${uniqueName} Test` });
    await expect(studentRow.getByRole("button", { name: "Check In" })).toBeVisible();
    await studentRow.getByRole("button", { name: "Check In" }).click();

    // Verify checked in state
    await expect(
      studentRow.getByRole("button", { name: "Checked In" })
    ).toBeVisible();
    await expect(studentRow).toHaveClass(/bg-green-50/);
  });

  test("can remove a check-in", async ({ page }) => {
    // Create a student
    await page.goto("/students/new");
    const uniqueName = `Unchk${Date.now()}`;
    await page.getByLabel("First Name *").fill(uniqueName);
    await page.getByLabel("Last Name *").fill("Test");
    await page.getByRole("button", { name: "Add Student" }).click();

    // Check them in
    await page.goto("/attendance");
    const studentRow = page.locator("li").filter({ hasText: `${uniqueName} Test` });
    await studentRow.getByRole("button", { name: "Check In" }).click();

    // Wait for check-in to complete
    await expect(
      studentRow.getByRole("button", { name: "Checked In" })
    ).toBeVisible();

    // Remove check-in
    await studentRow.getByRole("button", { name: "Checked In" }).click();

    // Verify unchecked state
    await expect(
      studentRow.getByRole("button", { name: "Check In" })
    ).toBeVisible();
  });

  test("can filter by class type", async ({ page }) => {
    await page.goto("/attendance");

    // Select different class types
    await page.getByLabel("Class Type").selectOption("nogi");
    await expect(page).toHaveURL(/classType=nogi/);

    await page.getByLabel("Class Type").selectOption("open_mat");
    await expect(page).toHaveURL(/classType=open_mat/);

    await page.getByLabel("Class Type").selectOption("gi");
    await expect(page).toHaveURL(/classType=gi/);
  });

  test("can filter by date", async ({ page }) => {
    await page.goto("/attendance");

    // Change date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    await page.getByLabel("Date").fill(dateStr);
    await expect(page).toHaveURL(new RegExp(`date=${dateStr}`));
  });

  test("check-in count updates correctly", async ({ page }) => {
    // Create a student
    await page.goto("/students/new");
    const uniqueName = `CountTest${Date.now()}`;
    await page.getByLabel("First Name *").fill(uniqueName);
    await page.getByLabel("Last Name *").fill("Counter");
    await page.getByRole("button", { name: "Add Student" }).click();

    // Go to attendance on a specific date to avoid interference
    const testDate = "2099-01-01";
    await page.goto(`/attendance?date=${testDate}&classType=gi`);

    // Get initial count
    const countText = page.getByText(/\d+ of \d+ checked in/);
    const initialText = await countText.textContent();
    const initialCount = parseInt(initialText?.match(/(\d+) of/)?.[1] || "0");

    // Check in the student
    const studentRow = page.locator("li").filter({ hasText: `${uniqueName} Counter` });
    await studentRow.getByRole("button", { name: "Check In" }).click();

    // Verify count increased
    await expect(countText).toContainText(`${initialCount + 1} of`);
  });
});
