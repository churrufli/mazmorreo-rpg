// Run after npm run web:build and npx vite preview --port 5173.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    for (const { width, height } of [{ width: 390, height: 844 }, { width: 1280, height: 800 }, { width: 1024, height: 768 }, { width: 844, height: 390 }]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(process.env.WEB_URL || 'http://127.0.0.1:5173/');
      if (width > height && width >= 700) {
        const bounds = await page.locator('#root').boundingBox();
        assert.ok(bounds && Math.abs(bounds.width - width) < 2, 'Landscape root must fill the viewport');
        assert.ok(bounds && Math.abs(bounds.height - height) < 2, 'Landscape root must fill viewport height');
      }
      const fullscreen = page.getByRole('button', { name: 'Pantalla completa', exact: true });
      await fullscreen.click();
      await page.waitForFunction(() => document.fullscreenElement === document.documentElement);
      await page.getByRole('button', { name: 'Salir de pantalla completa', exact: true }).click();
      await page.waitForFunction(() => !document.fullscreenElement);
      // Salir mediante el navegador también debe actualizar el botón.
      await fullscreen.click();
      await page.waitForFunction(() => !!document.fullscreenElement);
      await page.evaluate(() => document.exitFullscreen());
      await fullscreen.waitFor();
      await page.getByRole('button', { name: 'Nueva partida', exact: true }).click();
      await page.getByRole('button').filter({ hasText: 'Archivo 1' }).first().click();
      for (const name of ['Elegir especie', 'Elegir clase', 'Elegir atributos', 'Poner nombre', 'Empezar la aventura']) {
        await page.getByRole('button', { name, exact: true }).click();
      }
      for (let i = 0; i < 4; i++) {
        await page.getByLabel('Continuar diálogo').click();
        await page.waitForTimeout(100);
      }
      await page.getByRole('button', { name: /Ir a la mazmorra/ }).waitFor();
      assert.ok(await page.evaluate(() => localStorage.getItem('mazmorreo:slot:1')));
      await page.getByRole('button', { name: /Ir a la mazmorra/ }).click();
      for (let i = 0; i < 30; i++) {
        const dialog = page.getByLabel('Continuar diálogo');
        if (await dialog.count()) { await dialog.click(); await page.waitForTimeout(100); }
      }
      await page.waitForTimeout(800);
      assert.ok(await page.locator('svg polygon').count(), 'Hexagonal map rendered');
      await page.screenshot({ path: `/tmp/mazmorreo-web-${width}x${height}.png` });
      await page.getByRole('button', { name: 'Volver al menú' }).click();
      await page.getByRole('button', { name: 'Salir', exact: true }).click();
      await page.reload();
      await page.getByRole('button', { name: 'Cargar partida', exact: true }).click();
      await page.getByRole('button').filter({ hasText: 'Archivo 1' }).first().click();
      await page.getByRole('button', { name: 'Información del mapa' }).waitFor();
      assert.deepEqual(errors, [], 'No browser or resource errors');
      console.log(`PASS ${width}x${height}px: character, town, map, save, exit, reload and load`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
