import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

interface Scenario {
  id: string;
  name: string;
}

const manifest = JSON.parse(
  readFileSync(new URL("../src/assets/scenarios.json", import.meta.url), "utf8"),
) as { scenarios: Scenario[] };

const totals = {
  focusSeconds: 9300,
  breakSeconds: 600,
  completedFocus: 6,
  interruptedFocus: 0,
  sessions: 8,
};

async function mockApi(
  page: Page,
  character: string,
  userOverrides: Record<string, unknown> = {},
) {
  await page.route(/\.(mp3|ogg|wav|m4a)$/, (route) =>
    route.fulfill({ status: 200, contentType: "audio/mpeg", body: "" }),
  );
  await page.route("**/api/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "00000000-0000-0000-0000-000000000001",
          email: "e2e@focus.test",
          character,
          focusMinutes: 25,
          breakMinutes: 5,
          autoCycle: false,
          longBreakMinutes: 15,
          pomodorosUntilLongBreak: 4,
          dailyFocusGoalMinutes: 180,
          ...userOverrides,
        },
      }),
    }),
  );
  await page.route("**/api/sessions/stats**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ days: [], totals }),
    }),
  );
  await page.route("**/api/sessions/tasks**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        tasks: [
          {
            label: "Estudar inglês com um nome bem comprido para testar a quebra de linha",
            focusSeconds: 45600,
            completedFocus: 34,
            sessions: 40,
            activeDays: 9,
            firstAt: "2026-09-02T10:00:00.000Z",
            lastAt: "2026-09-25T10:00:00.000Z",
          },
        ],
      }),
    }),
  );
}

async function previewPixel(page: Page) {
  return page.getByAltText("Pré-visualização do card de compartilhamento").evaluate(
    (element) => {
      const image = element as HTMLImageElement;
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const [red, green, blue, alpha] = ctx.getImageData(4, 4, 1, 1).data;
      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        pixel: [red, green, blue, alpha],
      };
    },
  );
}

for (const scenario of manifest.scenarios) {
  test(`renders the share card for the "${scenario.id}" scenario`, async ({
    page,
  }) => {
    await mockApi(page, scenario.id);
    await page.goto("/performance");
    await page.getByRole("button", { name: "Compartilhar hoje" }).click();

    const dayCard = await (async () => {
      await expect(
        page.getByAltText("Pré-visualização do card de compartilhamento"),
      ).toBeVisible();
      return previewPixel(page);
    })();
    expect(dayCard).toMatchObject({ width: 1080, height: 1080 });
    expect(dayCard.pixel[3]).toBe(255);

    await page.getByRole("radio", { name: "Story 9:16" }).click();
    await expect.poll(async () => (await previewPixel(page)).height).toBe(1920);

    await page.getByRole("radio", { name: "Tarefa" }).click();
    await expect(page.getByRole("combobox")).toBeVisible();
    await expect.poll(async () => (await previewPixel(page)).width).toBe(1080);
  });
}

test("downloads the card as a PNG", async ({ page }) => {
  await mockApi(page, manifest.scenarios[0].id);
  await page.goto("/performance");
  await page.getByRole("button", { name: "Compartilhar hoje" }).click();
  await expect(
    page.getByAltText("Pré-visualização do card de compartilhamento"),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar imagem" }).first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^focus-trail-dia-\d{4}-\d{2}-\d{2}\.png$/);
});

test("offers sharing right after a focus session ends", async ({ page }) => {
  await page.clock.install();
  await mockApi(page, manifest.scenarios[0].id, { focusMinutes: 1 });
  await page.route("**/api/sessions", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ session: {} }),
        })
      : route.fallback(),
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Iniciar" }).click();
  await expect(page.getByRole("button", { name: "Compartilhar" })).toHaveCount(0);

  await page.clock.fastForward("01:05");
  await page.clock.resume();
  await page.getByRole("button", { name: "Compartilhar" }).click();

  await expect(
    page.getByAltText("Pré-visualização do card de compartilhamento"),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "Dia" })).toBeChecked();
});

test("shares a task straight from a history row", async ({ page }) => {
  await mockApi(page, manifest.scenarios[0].id);
  await page.route("**/api/sessions?**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessions: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            userId: "00000000-0000-0000-0000-000000000001",
            startedAt: "2026-09-25T10:00:00.000Z",
            endedAt: "2026-09-25T10:25:00.000Z",
            durationSeconds: 1500,
            type: "focus",
            completed: true,
            character: manifest.scenarios[0].id,
            taskLabel: "Estudar inglês com um nome bem comprido para testar a quebra de linha",
            createdAt: "2026-09-25T10:25:00.000Z",
          },
        ],
        nextCursor: null,
      }),
    }),
  );

  await page.goto("/history");
  await page.getByRole("button", { name: "Compartilhar sessão" }).first().click();

  await expect(page.getByRole("radio", { name: "Tarefa" })).toBeChecked();
  await expect(page.getByRole("combobox")).toContainText("Estudar inglês");
  await expect(
    page.getByAltText("Pré-visualização do card de compartilhamento"),
  ).toBeVisible();
});
