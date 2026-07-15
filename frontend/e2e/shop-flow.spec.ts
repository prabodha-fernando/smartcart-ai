import { expect, test } from "@playwright/test";

const backend = process.env.E2E_BACKEND_URL || "http://localhost:4000/api";

test("login, cart, wishlist, checkout, and order history work end to end", async ({ page, request }) => {
  const email = `browser-e2e-${Date.now()}@example.com`;
  const password = "browser-e2e-password-123";
  const registration = await request.post(`${backend}/auth/register`, {
    data: { name: "Browser E2E", email, password },
  });
  expect(registration.ok()).toBeTruthy();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await expect(page).not.toHaveURL(/\/login/);

  await page.getByRole("button", { name: "Open AI assistant" }).click();
  const assistant = page.locator("#floating-ai-assistant");
  await assistant
    .getByRole("button", { name: "Top-rated smartphone under $500" })
    .click();
  await expect(assistant.locator('a[href^="/products/"]').first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(assistant.getByText(/rating|rated|matching|match/i).first()).toBeVisible();
  await page.getByRole("button", { name: "Close AI assistant" }).first().click();
  await expect(assistant).not.toBeVisible();
  await page.getByRole("button", { name: "Open AI assistant" }).click();
  await expect(assistant.locator('a[href^="/products/"]').first()).toBeVisible();
  await page.getByRole("button", { name: "Close AI assistant" }).first().click();

  await page.goto("/products/1");
  await page.getByRole("button", { name: "Add to Favorites" }).click();
  await expect(page.getByRole("button", { name: "Added to Favorites" })).toBeVisible();
  await page.getByRole("button", { name: "Add to Cart" }).click();

  const accessToken = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("smartcart-auth") || "{}");
    return stored.state?.accessToken as string;
  });
  await expect.poll(async () => {
    const cart = await request.get(`${backend}/cart`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return (await cart.json()).data?.cart?.totalItems;
  }).toBe(1);

  await page.goto("/cart");
  await expect(page.getByText("Essence Mascara Lash Princess")).toBeVisible();
  await page.getByRole("button", { name: /Increase Essence Mascara Lash Princess quantity/ }).click();
  await expect.poll(async () => {
    const cart = await request.get(`${backend}/cart`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return (await cart.json()).data?.cart?.totalItems;
  }).toBe(2);
  await page.reload();
  await expect(page.getByText("Essence Mascara Lash Princess")).toBeVisible();

  await page.goto("/favorites");
  await page.reload();
  await expect(page.getByText("Essence Mascara Lash Princess")).toBeVisible();
  await page.getByRole("button", { name: "Remove Essence Mascara Lash Princess from favorites" }).click();
  await expect.poll(async () => {
    const wishlist = await request.get(`${backend}/wishlist`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return (await wishlist.json()).data?.wishlist?.totalItems;
  }).toBe(0);

  await page.goto("/cart");
  await page.getByRole("button", { name: "Proceed to checkout" }).click();
  await expect(page).toHaveURL(/\/orders\/[a-f0-9]{24}$/);
  await expect(page.getByText("Order pending")).toBeVisible();

  await page.goto("/orders");
  await expect(page.getByText(/Order #[A-F0-9]{8}/)).toBeVisible();
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Email").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/orders");
  await expect(page.getByText(/Order #[A-F0-9]{8}/)).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByText("Your cart is empty")).toBeVisible();
  await page.goto("/favorites");
  await expect(page.getByText(/No favorites yet/i)).toBeVisible();
});
