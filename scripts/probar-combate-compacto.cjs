// Vite local: npm run web -- --port 5194
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    for (const [width, height] of [[360,640], [384,720], [390,844], [320,640], [844,390]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(process.env.COMBAT_URL || 'http://127.0.0.1:5194');
      await page.getByRole('button', {name:'Nueva partida',exact:true}).waitFor();
      await page.evaluate(async root => {
        const { useStore } = await import(`${root}/src/store.ts`);
        const { newGame } = await import(`${root}/src/engine/game.ts`);
        const { startCombat, current, endTurn } = await import(`${root}/src/engine/combat.ts`);
        const { enterZone } = await import(`${root}/src/engine/dungeon.ts`);
        const { newItem, createAlly } = await import(`${root}/src/engine/rules.ts`);
        const { setDev } = await import(`${root}/src/storage.web.ts`);
        setDev(true);
        const g = newGame(7,'Maren de prueba','ranger','elf');
        const hero = g.party[0];
        hero.row='front'; hero.level=5; hero.slots=[3,1,1]; hero.channel=2; hero.hp=Math.max(1,hero.maxHp-3);
        hero.items=['mace','shortbow','potion_healing','potion_healing'].map(newItem);
        for (const id of ['anselmo','ivelle','telmo']) g.party.push(createAlly(id,5,6500,'corazon_hueco'));
        enterZone(g,'z1');
        const cb=startCombat(g,'z1_e06');
        for (let i=0;i<30 && current(cb).charId!==hero.id;i++) endTurn(g,cb);
        if (current(cb).charId!==hero.id) throw new Error('No se ha preparado el turno del héroe');
        useStore.setState({game:g,combat:cb,screen:'game'});
        window.testCompactState=()=>JSON.stringify(useStore.getState().combat);
        window.testPartyKeys=cb.units.filter(u=>u.side==='party').map(u=>u.key);
      }, `/@fs${process.cwd()}`);
      await page.getByRole('button',{name:'¡A luchar!',exact:true}).click();
      await page.waitForTimeout(2200);
      await page.getByRole('button',{name:'ATACAR',exact:true}).click();
      const categories=page.getByTestId('combat-categories');
      const parents=categories.locator(':scope > [role="button"]');
      assert.equal(await parents.count(),3);
      const rects=await parents.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
      assert.ok(Math.abs(rects[0].y-rects[1].y)<2&&rects[2].y>rects[0].y,`Dos categorías por fila, última centrada: ${JSON.stringify(rects)}`);
      assert.ok(rects.every(r=>r.height<=46),'Botones compactos, también con nombres largos');
      const controls=await page.getByTestId('combat-controls').boundingBox();
      const field=await page.getByTestId('combat-field').boundingBox();
      if(width<height) {
        assert.ok(field.height>=height*.6,'El campo conserva la mayor parte del alto');
        assert.ok(field.y+field.height<=controls.y+2,'El campo no se solapa con los controles');
      }
      await page.screenshot({path:`/tmp/mazmorreo-compacto-${width}x${height}.png`});
      for(const key of await page.evaluate(()=>window.testPartyKeys)) {
        const r=await page.getByTestId(`combat-unit-${key}`).boundingBox();
        assert.ok(r && r.y>=field.y-1 && r.y+r.height<=field.y+field.height+1,`Carta ${key} visible sin desplazar el campo: ${JSON.stringify(r)}`);
      }
      const mace=await page.getByRole('button',{name:'MAZA',exact:true}).boundingBox();
      const bow=await page.getByRole('button',{name:'ARCO CORTO',exact:true}).boundingBox();
      assert.ok(Math.abs(mace.y-bow.y)<2 && bow.x+bow.width<=controls.x+controls.width+1,'Dos acciones hijas completas en una fila');
      const dev=await page.getByRole('button',{name:'GANAR COMBATE',exact:true}).boundingBox();
      assert.ok(dev.height<=28,'El control de desarrollador no ocupa una fila de botones grandes');
      const flee=await page.getByRole('button',{name:'HUIR',exact:true}).boundingBox();
      assert.ok(flee && flee.y<field.y+60,'HUIR arriba, lejos de TERMINAR TURNO');
      for(const name of ['ESQUIVAR','TERMINAR TURNO']) {
        const b=await page.getByRole('button',{name,exact:true}).boundingBox();
        assert.ok(b.y>=controls.y && b.y+b.height<=controls.y+controls.height+1,`${name} visible sin desplazar controles`);
      }
      // Abrir otra categoría no mueve el campo de batalla (panel de alto fijo).
      const cardBefore=await page.getByTestId(`combat-unit-${(await page.evaluate(()=>window.testPartyKeys))[0]}`).boundingBox();
      await page.getByRole('button',{name:'OBJETOS',exact:true}).click();await page.waitForTimeout(200);
      const cardAfter=await page.getByTestId(`combat-unit-${(await page.evaluate(()=>window.testPartyKeys))[0]}`).boundingBox();
      assert.deepEqual(cardAfter,cardBefore,'Las cartas no cambian al abrir otra categoría');
      // Primer toque en una acción: explica sin ejecutar nada.
      await page.getByRole('button',{name:'ATACAR',exact:true}).click();
      const before=await page.evaluate(()=>window.testCompactState());
      await page.getByRole('button',{name:'ARCO CORTO',exact:true}).click();
      await page.getByRole('button',{name:'CANCELAR ACCIÓN',exact:true}).waitFor();
      assert.equal(await page.evaluate(()=>window.testCompactState()),before);
      await page.getByRole('button',{name:'CANCELAR ACCIÓN',exact:true}).click();
      if(width===384) {
        await page.evaluate(async root=>{
          const {useStore}=await import(`${root}/src/store.ts`);
          const g=useStore.getState().game;
          g.party[0].cls='cleric';
          useStore.setState({game:{...g}});
        }, `/@fs${process.cwd()}`);
        await page.getByRole('button',{name:'HABILIDADES',exact:true}).click();
        const grid=await page.getByTestId('combat-action-scroll').getByRole('button').evaluateAll(n=>n.map(x=>{const r=x.getBoundingClientRect();return {l:r.left,r:r.right};}));
        assert.ok(grid.length>2 && grid.every(b=>b.l>=controls.x-1 && b.r<=controls.x+controls.width+1),'Todas las habilidades completas, sin carrusel lateral');
      }
      assert.deepEqual(errors,[]);
      console.log(`PASS compacto ${width}x${height}: tres categorías, rejilla, panel fijo y cuatro aliados visibles`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
