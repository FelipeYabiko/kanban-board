import { expect, type Page, test } from "@playwright/test";

const column = (page: Page, name: string) => page.getByRole("region", { name });
const card = (page: Page, title: string) => page.getByTestId("card").filter({ hasText: title });

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByTestId("column")).toHaveCount(3);
  // Erros de hidratação aparecem no console; nenhum é aceitável.
  expect(errors).toEqual([]);
});

test("adiciona um cartão e mantém depois de recarregar", async ({ page }) => {
  const todo = column(page, "A fazer");
  await todo.getByRole("button", { name: "+ Adicionar cartão" }).click();
  await todo.getByLabel("Título do novo cartão").fill("Estudar dnd-kit");
  await todo.getByLabel("Título do novo cartão").press("Enter");

  await expect(todo.getByTestId("card")).toHaveCount(4);
  await page.reload();
  await expect(column(page, "A fazer").getByText("Estudar dnd-kit")).toBeVisible();
});

test("edita título e etiquetas pelo diálogo e filtra por etiqueta", async ({ page }) => {
  await card(page, "Montar layout responsivo").click();
  const dialog = page.getByRole("dialog", { name: "Editar cartão" });
  await dialog.getByLabel("Título").fill("Layout responsivo pronto");
  await dialog.getByRole("button", { name: "Urgente" }).click();
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(dialog).not.toBeVisible();

  await page.getByLabel("Filtrar por etiqueta").selectOption("urgente");
  await expect(page.getByTestId("card")).toHaveCount(2);
  await expect(card(page, "Layout responsivo pronto")).toBeVisible();

  await page.getByLabel("Filtrar por etiqueta").selectOption("");
  await page.getByLabel("Buscar cartões").fill("ACAO");
  await expect(page.getByTestId("card")).toHaveCount(0);
});

test("move cartão entre colunas com o teclado", async ({ page }) => {
  await card(page, "Filtre por texto ou etiqueta").focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");

  await expect(column(page, "Fazendo").getByText("Filtre por texto ou etiqueta")).toBeVisible();
  await expect(column(page, "A fazer").getByTestId("card")).toHaveCount(2);
});

test("move cartão entre colunas com o mouse", async ({ page }) => {
  const source = card(page, "Corrigir bug no modo escuro");
  const target = column(page, "Feito").getByTestId("card").first();
  const from = (await source.boundingBox())!;
  const to = (await target.boundingBox())!;

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2 + 20, { steps: 15 });
  await page.mouse.up();

  await expect(column(page, "Feito").getByText("Corrigir bug no modo escuro")).toBeVisible();
  await page.reload();
  await expect(column(page, "Feito").getByTestId("card")).toHaveCount(2);
});

test("Esc cancela o arraste e devolve o cartão", async ({ page }) => {
  await card(page, "Clique num cartão para editar").focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");

  await expect(column(page, "A fazer").getByText("Clique num cartão para editar")).toBeVisible();
});

test("cria e exclui uma coluna", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Nome da nova coluna").fill("Revisão");
  await page.getByLabel("Nome da nova coluna").press("Enter");
  await expect(page.getByTestId("column")).toHaveCount(4);

  await page.getByRole("button", { name: "Excluir coluna Revisão" }).click();
  await expect(page.getByTestId("column")).toHaveCount(3);
});

test("tema escuro é lembrado sem piscar", async ({ page }) => {
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Alternar tema claro/escuro" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("exporta o quadro em JSON", async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportar" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("kanban.json");
});
