// Contra npm run web -- --port 5174 (Vite permite importar módulos para preparar estados).
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    for (const [width, height] of [[390,844], [844,390], [1280,800], [320,568]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', e => { errors.push(e.message); console.error('Browser:', e.message); });
      page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(process.env.COMBAT_URL || 'http://127.0.0.1:5174');
      await page.getByRole('button', { name: 'Nueva partida', exact: true }).waitFor();
      await page.evaluate(async root => {
        const { useStore } = await import(`${root}/src/store.ts`);
        const { newGame } = await import(`${root}/src/engine/game.ts`);
        const { startCombat, current, endTurn } = await import(`${root}/src/engine/combat.ts`);
        const { enterZone } = await import(`${root}/src/engine/dungeon.ts`);
        const { newItem } = await import(`${root}/src/engine/rules.ts`);
        const g = newGame(7, 'Prueba', 'fighter', 'human');
        g.party[0].items = [newItem('mace')];
        enterZone(g, 'z1');
        const cb = startCombat(g, 'z1_e01');
        for (let i=0; i<20 && current(cb).side !== 'party'; i++) endTurn(g, cb);
        useStore.setState({ game:g, combat:cb, screen:'game' });
        window.testState = () => JSON.stringify(useStore.getState().combat);
      }, `/@fs${process.cwd()}`);
      await page.getByRole('button', { name:'¡A luchar!', exact:true }).click();
      await page.waitForTimeout(2200);
      const initial = await page.evaluate(() => window.testState());
      await page.getByRole('button', { name:'ATACAR', exact:true }).click();
      assert.equal(await page.evaluate(() => window.testState()), initial, 'ATACAR abre armas sin ejecutarlas aunque solo haya una');
      await page.getByRole('button', { name:'HUIR', exact:true }).waitFor();
      const mace = page.getByRole('button', { name:'MAZA', exact:true });
      await mace.waitFor();
      await page.waitForFunction(() => Array.from(document.images).some(i => i.src.includes('boton_padre') && i.complete && i.naturalWidth === 1200));
      const before = await page.evaluate(() => window.testState());
      const tab = page.getByRole('button', { name:'Información sobre MAZA', exact:true });
      const bounds = await tab.boundingBox();
      assert.ok(bounds.width >= 44 && bounds.height >= 44);
      await tab.click();
      assert.equal(await page.evaluate(() => window.testState()), before, 'La información no ejecuta ni consume acciones');
      assert.equal(await page.getByRole('button', { name:'USAR', exact:true }).count(), 0);
      await page.getByText('Ataque con el arma:', { exact:false }).waitFor();
      await page.getByLabel('Ilustración de MAZA', { exact:true }).waitFor();
      await page.screenshot({ path:`/tmp/mazmorreo-combate-info-${width}x${height}.png` });
      await page.getByRole('button', { name:'CANCELAR', exact:true }).click();
      await page.getByRole('button', { name:'DEFENDER', exact:true }).click();
      await page.getByRole('button', { name:'ESQUIVAR', exact:true }).waitFor();
      assert.equal(await page.getByRole('button', { name:'DEFENDER', exact:true }).getAttribute('aria-pressed'), 'true');
      await page.getByRole('button', { name:'Información sobre ESQUIVAR', exact:true }).click();
      assert.equal(await page.evaluate(() => window.testState()), before);
      await page.getByRole('button', { name:'CANCELAR', exact:true }).click();
      await page.screenshot({ path:`/tmp/mazmorreo-combate-${width}x${height}.png` });
      await page.getByRole('button', { name:'ATACAR', exact:true }).click();
      await mace.click();
      assert.notEqual(await page.evaluate(() => window.testState()), before, 'El cuerpo de la acción única sí ataca');
      assert.deepEqual(errors, []);
      console.log(`PASS combate ${width}x${height}: ATACAR seguro, arma explícita, HUIR visible y pestañas independientes`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
