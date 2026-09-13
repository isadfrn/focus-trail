import { expect, test } from "@playwright/test";

const user = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "e2e@focus.test",
  character: "mario-world",
  focusMinutes: 25,
  breakMinutes: 5,
};

test.beforeEach(async ({ page }) => {
  await page.route(/\.(mp3|ogg|wav|m4a)$/, (route) =>
    route.fulfill({ status: 200, contentType: "audio/mpeg", body: "" }),
  );
  await page.route("**/api/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "unauthorized" }),
    }),
  );
});

test("shows the login screen when unauthenticated", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
});

test("logs in, reaches the timer, and controls the audio player", async ({
  page,
}) => {
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({
      status: 200,
      headers: { "set-cookie": "ft_token=stub; Path=/" },
      contentType: "application/json",
      body: JSON.stringify({ user }),
    }),
  );

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill("password123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(
    page.getByRole("button", { name: /Iniciar|Recomecar/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByText("Música")).toBeVisible();
  await expect(page.getByText("Ruído")).toBeVisible();

  await page.getByRole("button", { name: "Tocar Música" }).click();
  await expect(
    page.getByRole("button", { name: "Pausar Música" }),
  ).toBeVisible();
});
