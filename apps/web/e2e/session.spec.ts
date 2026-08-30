import { expect, test } from "@playwright/test";

test("Host, projetor e equipe percorrem o início da sessão", async ({ browser, request }) => {
  const createdResponse = await request.post("/api/sessions", { data: { integrityPolicy: "ZERO_ROUND" } });
  expect(createdResponse.status()).toBe(201);
  const created = await createdResponse.json() as { code: string; hostToken: string };

  const hostContext = await browser.newContext();
  await hostContext.addInitScript(({ code, token }) => {
    sessionStorage.setItem("hemocase:host-code", code);
    sessionStorage.setItem("hemocase:host-token", token);
  }, { code: created.code, token: created.hostToken });
  const host = await hostContext.newPage();
  await host.goto("/host");

  const teamContext = await browser.newContext({ ...test.info().project.use });
  const team = await teamContext.newPage();
  await team.goto(`/join/${created.code}`);
  await team.getByLabel("Nome da equipe").fill("Equipe Teste");
  await team.getByRole("checkbox").check();
  await team.getByRole("button", { name: /entrar na sala/i }).click();
  await expect(team.getByRole("heading", { name: /aguarde a transmissão/i })).toBeVisible();
  await expect(host.getByText("Equipe Teste")).toBeVisible();

  const screenContext = await browser.newContext();
  await screenContext.addInitScript((code) => sessionStorage.setItem(`hemocase:intro:${code}`, "done"), created.code);
  const screen = await screenContext.newPage();
  await screen.goto(`/screen/${created.code}`);
  await expect(screen.getByText(created.code, { exact: true })).toBeVisible();
  await expect(screen.getByAltText(/QR Code/)).toBeVisible();

  await host.getByRole("button", { name: /avançar/i }).click();
  await expect(team.getByRole("heading", { name: /mantenha os olhos/i })).toBeVisible();
  await host.getByRole("button", { name: /avançar/i }).click();
  await expect(team.getByText(/DNA → RNA → proteína/i)).toBeVisible();
  await team.getByRole("button", { name: /^A / }).click();
  await team.getByRole("button", { name: /confirmar resposta/i }).click();
  await expect(team.getByRole("button", { name: /resposta lacrada/i })).toBeDisabled();

  await hostContext.close();
  await teamContext.close();
  await screenContext.close();
});

test("exportação recusa token de Host inválido", async ({ request }) => {
  const created = await (await request.post("/api/sessions", { data: {} })).json() as { code: string };
  const response = await request.get(`/api/sessions/${created.code}/export?token=invalid`);
  expect(response.status()).toBe(401);
});
