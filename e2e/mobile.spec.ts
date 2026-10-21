import { expect, test } from "@playwright/test";

test("no celular, as colunas rolam na horizontal sem quebrar a página", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("column")).toHaveCount(3);

  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const viewport = page.viewportSize()!.width;
  expect(pageWidth).toBeLessThanOrEqual(viewport);

  await page.getByRole("region", { name: "Feito" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("region", { name: "Feito" })).toBeInViewport();
});
