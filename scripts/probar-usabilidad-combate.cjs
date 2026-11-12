const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({args:['--no-sandbox']});
  const report=[];
  try {
    for(const [width,height] of [[320,640],[360,640],[390,844],[844,390],[1280,720]]) {
      const page=await browser.newPage({viewport:{width,height}}),errors=[];
      page.setDefaultTimeout(10000);
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(process.env.COMBAT_URL||'http://127.0.0.1:5194');
      const button=name=>page.getByRole('button',{name,exact:true});
      await button('Nueva partida').waitFor();
      await page.evaluate(async root=>{
        const {useStore}=await import(`${root}/src/store.ts`);
        const {newGame}=await import(`${root}/src/engine/game.ts`);
        const {startCombat,current,endTurn}=await import(`${root}/src/engine/combat.ts`);
        const {enterZone}=await import(`${root}/src/engine/dungeon.ts`);
        const {newItem,createAlly}=await import(`${root}/src/engine/rules.ts`);
        const {setDev}=await import(`${root}/src/storage.web.ts`);setDev(false);
        window.ux={
          reset:()=>useStore.setState({screen:'title',combat:undefined,game:undefined}),
          prepare:(party)=>{
            const g=newGame(7,'Prueba','fighter','human'),c=g.party[0];c.secondWind=0;
            c.items=[newItem('mace'),newItem('potion_healing')];c.hp=Math.max(1,c.maxHp-3);
            if(party)for(const id of ['anselmo','ivelle','telmo'])g.party.push(createAlly(id,5,6500,'corazon_hueco'));
            enterZone(g,'z1');const cb=startCombat(g,party?'z1_e06':'z1_e01');
            for(let i=0;i<30&&current(cb).charId!==c.id;i++)endTurn(g,cb);
            if(current(cb).charId!==c.id)throw new Error('No se ha encontrado el turno del héroe');
            cb.units.filter(u=>u.side==='enemy').forEach((u,i)=>{u.hp=100-i;u.maxHp=100;});
            useStore.setState({game:g,combat:cb,screen:'game'});
          },
          flags:(flags)=>{const cb=JSON.parse(JSON.stringify(useStore.getState().combat));Object.assign(cb,flags);useStore.setState({combat:cb});},
          paralyze:()=>{const cb=JSON.parse(JSON.stringify(useStore.getState().combat));current(cb).paralyzed=true;useStore.setState({combat:cb});},
          data:()=>{const cb=useStore.getState().combat;return {cb,actor:current(cb),snapshot:JSON.stringify(cb)};},
        };
      },`/@fs${process.cwd()}`);
      const data=()=>page.evaluate(()=>window.ux.data());
      const prepare=async party=>{
        await page.evaluate(()=>window.ux.reset());await button('Nueva partida').waitFor();
        await page.evaluate(p=>window.ux.prepare(p),party);await button('¡A luchar!').click();
        await page.getByTestId('budget-action').waitFor();
      };
      const footer=async()=>{
        const c=await page.getByTestId('combat-controls').boundingBox();
        for(const name of ['ESQUIVAR','IR ATRÁS','TERMINAR TURNO']){const r=await button(name).boundingBox();assert.ok(r&&r.y>=c.y&&r.y+r.height<=c.y+c.height+1,`${name}: pie visible`);}
        const flee=await button('HUIR').boundingBox();assert.ok(flee&&flee.y>=0&&flee.y+flee.height<=height,'Huir visible arriba');
      };
      await prepare(true);
      const beforeCategory=(await data()).snapshot;
      await button('Información sobre ATACAR').click();await button('CANCELAR ACCIÓN').waitFor();
      assert.equal((await data()).snapshot,beforeCategory,'La pestaña de categoría no ataca');
      await button('CANCELAR ACCIÓN').click();
      if(width===390){
        const foe=(await data()).cb.units.find(u=>u.side==='enemy'&&u.row==='front');
        const beforeSheet=(await data()).snapshot;
        await page.getByTestId(`combat-unit-${foe.key}`).locator('[aria-label]').first().click({delay:500});
        await button('Cerrar').waitFor();assert.equal((await data()).snapshot,beforeSheet,'Mantener pulsado consulta sin ataque rápido');
        await button('Cerrar').click();
      }
      const field=await page.getByTestId('combat-field').boundingBox();let minimum=Infinity;
      for(const u of (await data()).cb.units.filter(u=>!u.dead&&!u.fled)){
        const r=await page.getByTestId(`combat-unit-${u.key}`).locator('[aria-label]').first().boundingBox();
        assert.ok(r.width>=44&&r.height>=44,`Objetivo ${u.name}: ${r.width}×${r.height}`);
        assert.ok(r.y>=field.y-1&&r.y+r.height<=field.y+field.height+1,`${u.name}: dentro del campo`);minimum=Math.min(minimum,r.width,r.height);
      }
      await page.evaluate(()=>window.ux.flags({acted:true}));
      assert.equal(await page.getByTestId('budget-action').innerText(),'0');
      assert.equal(await page.getByTestId('budget-move').innerText(),'1');
      const spent=(await data()).snapshot;await button('ESQUIVAR').click();
      await page.getByText(/Ya has utilizado la acción de este turno/).waitFor();
      await page.waitForTimeout(1300);assert.equal((await data()).snapshot,spent);
      await footer();await page.screenshot({path:`/tmp/mazmorreo-usabilidad-movimiento-${width}x${height}.png`});
      await button('CANCELAR ACCIÓN').click();await button('IR ATRÁS').click();
      assert.equal((await data()).actor.row,'back');assert.ok(!(await data()).actor.dodge);
      await prepare(true);await page.evaluate(()=>window.ux.flags({bonus:true}));
      const beforeInfo=(await data()).snapshot;await button('Información sobre ESQUIVAR').click();assert.equal((await data()).snapshot,beforeInfo);
      await button('CANCELAR ACCIÓN').click();
      // Mantener pulsado abre el cuadro de explicación encima de los botones, sin usar la acción.
      await button('ESQUIVAR').hover();await page.mouse.down();await page.waitForTimeout(600);await page.mouse.up();
      await page.getByTestId('combat-tip').waitFor();assert.equal((await data()).snapshot,beforeInfo,'La pulsación prolongada no usa la acción');
      await button('CANCELAR ACCIÓN').click();await button('ESQUIVAR').click();assert.equal((await data()).cb.acted,false);
      await button('Usar').click();assert.equal((await data()).cb.acted,true);assert.equal((await data()).actor.dodge,true);
      // Ya explicada una vez, ESQUIVAR se usa al tocarla, sin cuadro (el autor 2026-11-10).
      await page.waitForTimeout(350);await button('TERMINAR TURNO').click();
      await prepare(true);await button('MAZA').click();await button('CANCELAR ACCIÓN').waitFor();
      await page.evaluate(()=>window.ux.paralyze());assert.equal(await button('CANCELAR ACCIÓN').count(),0);assert.equal(await button('TERMINAR TURNO').count(),0);
      if(width===390){
        for(const modal of ['Registro del combate','Cómo funciona el combate','ficha']){
          await prepare(false);await button('ESQUIVAR').click();await page.waitForTimeout(350);
          await button('TERMINAR TURNO').click();await page.waitForTimeout(250);
          if(modal==='ficha'){const u=(await data()).cb.units.find(u=>u.side==='enemy');await page.getByTestId(`combat-unit-${u.key}`).locator('[aria-label]').first().click();}
          else await button(modal).click();
          await button('Cerrar').waitFor();assert.equal((await data()).cb.units.find(u=>u.side==='party').dodge,true);
          if(modal==='Registro del combate')await page.getByText(/Prueba se pone a la defensiva/).last().waitFor();
          const frozen=(await data()).snapshot;await page.waitForTimeout(2400);assert.equal((await data()).snapshot,frozen,`${modal}: pausa`);
          await page.screenshot({path:`/tmp/mazmorreo-usabilidad-${modal==='ficha'?'ficha':modal.startsWith('Registro')?'registro':'ayuda'}.png`});
          await button('Cerrar').click();await page.waitForFunction(before=>window.ux.data().snapshot!==before,frozen,{timeout:10000});
          await page.waitForFunction(()=>window.ux.data().actor.side==='party',null,{timeout:10000});
          assert.ok(!(await data()).actor.dodge);assert.equal((await data()).cb.acted,false);
        }
      }
      assert.deepEqual(errors,[]);report.push({width,height,minimumTarget:minimum,passed:true});
      console.log(`PASS usabilidad ${width}x${height}: costes, defensa, movimiento, pie fijo, objetivos y turnos`);
      await page.close();
    }
    fs.writeFileSync('/tmp/mazmorreo-usabilidad-resultados.json',JSON.stringify(report,null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
