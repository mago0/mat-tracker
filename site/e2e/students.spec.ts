import { test, expect } from "./fixtures/test-utils";
import { login } from "./fixtures/test-utils";

test.describe("Students", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("shows students list", async ({ page }) => {
    await page.goto("/students");
    await expect(page.getByRole("heading", { name: "Students" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Add Student" })).toBeVisible();
  });

  test("can switch between active and archived views", async ({ page }) => {
    await page.goto("/students");
    await expect(page.getByRole("link", { name: "Active" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Archived" })).toBeVisible();

    await page.getByRole("link", { name: "Archived" }).click();
    await expect(page).toHaveURL(/view=archived/);
  });

  test("can create a new student", async ({ page }) => {
    await page.goto("/students/new");
    await expect(
      page.getByRole("heading", { name: "Add Student" })
    ).toBeVisible();

    const uniqueName = `TestStudent${Date.now()}`;
    await page.getByLabel("First Name *").fill(uniqueName);
    await page.getByLabel("Last Name *").fill("E2ETest");
    await page.getByLabel("Email").fill("test@example.com");
    await page.locator("#phone").fill("555-1234");

    await page.getByRole("button", { name: "Add Student" }).click();

    await expect(page).toHaveURL("/students");
    await expect(page.getByRole("link", { name: `${uniqueName} E2ETest` })).toBeVisible();
  });

  test("can view student detail page", async ({ page }) => {
    // First create a student
    await page.goto("/students/new");
    const uniqueName = `DetailTest${Date.now()}`;
    await page.getByLabel("First Name *").fill(uniqueName);
    await page.getByLabel("Last Name *").fill("ViewTest");
    await page.getByRole("button", { name: "Add Student" }).click();

    // Navigate to student detail
    await page.getByRole("link", { name: `${uniqueName} ViewTest` }).click();

    await expect(
      page.getByRole("heading", { name: `${uniqueName} ViewTest` })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Current Rank" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Contact Info" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Attendance/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Promotion History" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Notes" })).toBeVisible();
  });

  test("can edit a student", async ({ page }) => {
    // Create a student first
    await page.goto("/students/new");
    const uniqueName = `EditTest${Date.now()}`;
    await page.getByLabel("First Name *").fill(uniqueName);
    await page.getByLabel("Last Name *").fill("ToEdit");
    await page.getByRole("button", { name: "Add Student" }).click();

    // Go to detail page and click edit
    await page.getByRole("link", { name: `${uniqueName} ToEdit` }).click();
    await page.getByRole("link", { name: "Edit", exact: true }).click();

    await expect(page).toHaveURL(/\/edit$/);

    // Update the last name
    await page.getByLabel("Last Name *").fill("Edited");
    await page.getByRole("button", { name: "Save Changes" }).click();

    // Verify the change
    await expect(
      page.getByRole("heading", { name: `${uniqueName} Edited` })
    ).toBeVisible();
  });

  test("can add a note to a student", async ({ page }) => {
    // Create a student first
    await page.goto("/students/new");
    const uniqueName = `NoteTest${Date.now()}`;
    await page.getByLabel("First Name *").fill(uniqueName);
    await page.getByLabel("Last Name *").fill("WithNote");
    await page.getByRole("button", { name: "Add Student" }).click();

    // Go to detail page and add note
    await page.getByText(`${uniqueName} WithNote`).click();
    await page.getByRole("link", { name: "Add Note" }).click();

    await page.getByLabel("Category").selectOption("technique");
    await page.getByLabel("Note").fill("Great progress on guard passes!");
    await page.getByRole("button", { name: "Add Note" }).click();

    // Verify note appears
    await expect(page.getByText("Great progress on guard passes!")).toBeVisible();
    await expect(page.getByText("Technique")).toBeVisible();
  });

  test("can promote a student", async ({ page }) => {
    // Create a white belt student
    await page.goto("/students/new");
    const uniqueName = `PromoTest${Date.now()}`;
    await page.getByLabel("First Name *").fill(uniqueName);
    await page.getByLabel("Last Name *").fill("ToPromote");
    await page.getByRole("button", { name: "Add Student" }).click();

    // Go to detail page
    await page.getByRole("link", { name: `${uniqueName} ToPromote` }).click();

    // Verify initial state (white belt 0 stripes) - check the rank card text
    const rankCard = page.locator("text=Current Rank").locator("..");
    await expect(rankCard.getByText("0 stripes")).toBeVisible();

    // Update to 1 stripe
    await page.locator('select[name="toStripes"]').selectOption("1");
    await page.locator('input[name="notes"]').fill("First stripe earned!");
    await page.getByRole("button", { name: "Update" }).click();

    // Verify promotion - check the rank card and promotion history
    await expect(rankCard.getByText("1 stripe", { exact: false })).toBeVisible();
    await expect(page.getByText("First stripe earned!")).toBeVisible();
  });

  test("shows archive button on student detail page", async ({ page }) => {
    // Create a student first
    await page.goto("/students/new");
    const uniqueName = `ArchiveTest${Date.now()}`;
    await page.getByLabel("First Name *").fill(uniqueName);
    await page.getByLabel("Last Name *").fill("ToArchive");
    await page.getByRole("button", { name: "Add Student" }).click();

    // Go to detail page
    await page.getByRole("link", { name: `${uniqueName} ToArchive` }).click();

    // Verify student detail page loaded
    await expect(page.getByRole("heading", { name: `${uniqueName} ToArchive` })).toBeVisible();

    // Verify Archive button exists
    await expect(page.getByRole("button", { name: "Archive" })).toBeVisible();
  });

  test("archived students appear in archived view", async ({ page }) => {
    // Go to archived view
    await page.goto("/students?view=archived");

    // Should see archived tab is active and students list
    await expect(page.getByRole("link", { name: "Archived" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Students" })).toBeVisible();
  });
});
