const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({args:['--no-sandbox']});
  try {
    for(const [width,height] of [[320,640],[360,640],[390,844],[844,390]]) {
      const page=await browser.newPage({viewport:{width,height}});
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.goto(process.env.COMBAT_URL||'http://127.0.0.1:5194');
      await page.getByRole('button',{name:'Nueva partida',exact:true}).waitFor();
      await page.evaluate(async root=>{
        const {useStore}=await import(`${root}/src/store.ts`);
        const {newGame}=await import(`${root}/src/engine/game.ts`);
        const {startCombat,current,endTurn}=await import(`${root}/src/engine/combat.ts`);
        const {enterZone}=await import(`${root}/src/engine/dungeon.ts`);
        const {newItem,createAlly}=await import(`${root}/src/engine/rules.ts`);
        const {setDev}=await import(`${root}/src/storage.web.ts`); setDev(false);
        window.flow={
          reset:()=>useStore.setState({screen:'title',combat:undefined,game:undefined}),
          prepare:(o)=>{
            const g=newGame(7,'Prueba',o.cleric?'cleric':'fighter','human'); const c=g.party[0];
            if(o.noSkills)c.secondWind=0;
            c.row=o.back?'back':'front'; c.hp=o.full?c.maxHp:Math.max(1,c.maxHp-3);
            if(o.surge){c.level=2;c.actionSurge=1;}
            if(o.cleric){c.level=5;c.slots=[4,3,2];c.channel=2;}
            c.items=['mace',...(o.potion?['potion_healing','potion_healing']:[])].map(newItem);
            if(o.party||o.many) for(const id of ['anselmo','ivelle','telmo']){
              const a=createAlly(id,5,6500,'corazon_hueco');a.hp=Math.max(1,a.maxHp-3);g.party.push(a);
            }
            enterZone(g,'z1'); const cb=startCombat(g,o.many?'z1_e06':'z1_e01');
            for(let i=0;i<30&&current(cb).charId!==c.id;i++)endTurn(g,cb);
            cb.units.filter(u=>u.side==='enemy').forEach((u,i)=>{u.maxHp=100;u.hp=100-i;});
            cb.acted=!!o.spent;
            useStore.setState({game:g,combat:cb,screen:'game'});
          },
          nextActor:()=>{const s=useStore.getState(),g=JSON.parse(JSON.stringify(s.game)),cb=JSON.parse(JSON.stringify(s.combat));endTurn(g,cb);return current(cb).key;},
          spendAction:()=>{const cb=useStore.getState().combat;useStore.setState({combat:{...cb,acted:true}});},
          spendAll:()=>{const cb=useStore.getState().combat;useStore.setState({combat:{...cb,acted:true,bonus:true,moved:true}});},
          snapshot:()=>{const s=useStore.getState();return JSON.stringify({cb:s.combat,items:s.game.party.map(c=>c.items),slots:s.game.party.map(c=>c.slots)});},
          data:()=>{const s=useStore.getState();return {actor:current(s.combat).key,result:s.combat?.result,acted:s.combat?.acted,bonus:s.combat?.bonus,roll:s.combat?.roll?.id,units:s.combat?.units,items:s.game.party[0].items.length};},
        };
      },`/@fs${process.cwd()}`);
      const button=name=>page.getByRole('button',{name,exact:true});
      const snapshot=()=>page.evaluate(()=>window.flow.snapshot());
      const data=()=>page.evaluate(()=>window.flow.data());
      const prepare=async options=>{
        await page.evaluate(()=>window.flow.reset());
        await button('Nueva partida').waitFor();
        await page.evaluate(o=>window.flow.prepare(o),options);
        await button('¡A luchar!').click();await page.waitForTimeout(2200);
      };
      const visibleInControls=async name=>{
        const a=await button(name).boundingBox(),b=await page.getByTestId('combat-controls').boundingBox();
        assert.ok(a&&a.y>=b.y-1&&a.y+a.height<=b.y+b.height+1,`${name} visible sin desplazar controles`);
      };
      const centeredText=async name=>{
        const b=button(name),t=b.getByTestId('combat-button-label');
        const result=await t.evaluate(n=>{const r=n.getBoundingClientRect(),b=n.parentElement.getBoundingClientRect();return {center:Math.abs(r.x+r.width/2-b.x-b.width/2),overflowX:n.scrollWidth-n.clientWidth,overflowY:n.scrollHeight-n.clientHeight,text:n.textContent};});
        assert.ok(result.center<2,`${name}: texto centrado`);
        assert.ok(result.overflowX<=1&&result.overflowY<=1,`${name}: texto completo sin recortes`);
        assert.equal(result.text.replace(/\s/g,''),name.replace(/\s/g,''));
      };
      const flee=async()=>{await button('HUIR').click();await button('Huir').click();};
      const visibleOnScreen=async name=>{
        const a=await button(name).boundingBox();
        assert.ok(a&&a.y>=0&&a.y+a.height<=height+1&&a.x>=0&&a.x+a.width<=width+1,`${name} visible en pantalla`);
      };
      // Una sola arma: ATACAR viene abierto y nada se ejecuta sin tocar.
      await prepare({potion:true,noSkills:true});
      let before=await snapshot();
      await visibleOnScreen('HUIR');await button('ATACAR').click();
      assert.equal(await snapshot(),before);
      await centeredText('ATACAR');await centeredText('TERMINAR TURNO');await centeredText('ESQUIVAR');await centeredText('MAZA');
      const dodge=await button('ESQUIVAR').boundingBox(),end=await button('TERMINAR TURNO').boundingBox();
      assert.ok(Math.abs(dodge.width-(await button('IR ATRÁS').boundingBox()).width)<1,'Defensa y movimiento del mismo ancho');
      // Tres categorías en una fila.
      const cats=await page.getByTestId('combat-categories').locator(':scope > [role="button"]').evaluateAll(n=>n.map(x=>x.getBoundingClientRect().y));
      assert.ok(Math.abs(cats[0]-cats[1])<2&&(cats.length<3||cats[2]>cats[0]),'Dos categorías por fila');
      const rollBefore=(await data()).roll||0;
      await button('MAZA').dblclick();
      assert.equal((await data()).acted,true);assert.equal((await data()).roll,rollBefore+1,'Doble toque no ejecuta dos ataques');
      // Tras gastar la acción, HUIR y el arma explican el coste sin ejecutarse.
      if(await button('CANCELAR ACCIÓN').count())await button('CANCELAR ACCIÓN').click();
      before=await snapshot();await button('HUIR').click();
      await page.getByText(/Ya has utilizado la acción de este turno/).waitFor();
      assert.equal(await snapshot(),before);assert.equal(await button('Huir').count(),0,'Sin acción no se ofrece huir');
      await button('CANCELAR ACCIÓN').click();
      await button('MAZA').click();assert.equal(await snapshot(),before);
      await button('CANCELAR ACCIÓN').click();
      // Varios enemigos distintos: elegir arma pide objetivo, permite cambiar o cancelar.
      await prepare({many:true});before=await snapshot();await button('MAZA').click();
      await button('CANCELAR ACCIÓN').waitFor();await visibleOnScreen('HUIR');assert.equal(await snapshot(),before);
      await button('HABILIDADES').click();assert.equal(await button('CANCELAR ACCIÓN').count(),0);assert.equal(await snapshot(),before);
      await button('ATACAR').click();await button('MAZA').click();await button('CANCELAR ACCIÓN').click();assert.equal(await snapshot(),before);
      await button('MAZA').click();await visibleOnScreen('HUIR');
      await page.screenshot({path:`/tmp/mazmorreo-flujo-objetivos-${width}x${height}.png`});
      // HUIR pide confirmación: «Seguir luchando» no gasta nada.
      await button('HUIR').click();await button('Seguir luchando').click();assert.equal(await snapshot(),before);
      await flee();assert.equal((await data()).result,'fled','Se puede huir antes de confirmar el objetivo del ataque');
      // Terminar el turno durante la elección tampoco ejecuta el ataque, ni se duplica por doble toque.
      await prepare({many:true});await button('MAZA').click();
      const pendingData=await data(),expectedActor=await page.evaluate(()=>window.flow.nextActor());await button('TERMINAR TURNO').dblclick();
      const ended=await data();assert.equal(ended.actor,expectedActor,'Doble toque en TERMINAR TURNO solo avanza un participante');assert.equal(ended.roll,pendingData.roll);
      assert.deepEqual(ended.units.filter(u=>u.side==='enemy').map(u=>u.hp),pendingData.units.filter(u=>u.side==='enemy').map(u=>u.hp));
      // Leer una explicación detiene el cierre automático de un turno sin opciones útiles.
      await prepare({full:true,noSkills:true});await page.evaluate(()=>window.flow.spendAll());await page.waitForTimeout(50);
      const readingActor=(await data()).actor;await button('HUIR').click();await button('CANCELAR ACCIÓN').waitFor();
      await page.waitForTimeout(1300);assert.equal((await data()).actor,readingActor);
      await button('CANCELAR ACCIÓN').click();await page.waitForTimeout(1300);assert.notEqual((await data()).actor,readingActor);
      // Primer toque explica, segundo ejecuta: la Oleada de acción devuelve la acción y vuelve a habilitar HUIR.
      await prepare({surge:true,spent:true});await button('HABILIDADES').click();await button('OLEADA DE ACCIÓN').click();
      assert.equal((await data()).acted,true,'El primer toque solo explica');
      await button('Usar').click();
      assert.equal((await data()).acted,false);await page.waitForTimeout(350);await flee();assert.equal((await data()).result,'fled');
      if(width===390) {
        // Gastar la acción no debe cerrar el turno si todavía queda un cambio de fila útil; se cambia con su botón.
        await prepare({many:true,full:true,noSkills:true});await page.evaluate(()=>window.flow.spendAction());
        const movingActor=(await data()).actor;await page.waitForTimeout(1300);assert.equal((await data()).actor,movingActor);
        await button('IR ATRÁS').click();
        const moved=(await data()).units.find(u=>u.key===movingActor);assert.equal(moved.row,'back');
      }
      // Retaguardia y vida completa: las acciones inútiles explican su motivo.
      await prepare({back:true,full:true,potion:true});before=await snapshot();
      await button('MAZA').click();assert.equal(await snapshot(),before);await button('CANCELAR ACCIÓN').click();
      await button('OBJETOS').click();await button('POCIÓN DE CURACIÓN ×2').click();assert.equal(await snapshot(),before);await button('CANCELAR ACCIÓN').click();
      // Curación con varios aliados: ni abrir OBJETOS ni cancelar gastan la poción.
      await prepare({cleric:true,party:true,potion:true,many:true});before=await snapshot();
      await button('OBJETOS').click();await button('POCIÓN DE CURACIÓN ×2').click();await button('CANCELAR ACCIÓN').waitFor();
      const units=(await data()).units,enemy=units.find(u=>u.side==='enemy'),ally=units.find(u=>u.side==='party'&&u.charId!=='hero');
      await page.getByTestId(`combat-unit-${enemy.key}`).locator('[aria-label]').first().click();assert.equal(await snapshot(),before,'Un enemigo no puede recibir una poción aliada');
      await page.getByText(/elige un aliado resaltado/).waitFor();
      await button('CANCELAR ACCIÓN').click();assert.equal(await snapshot(),before);
      await button('POCIÓN DE CURACIÓN ×2').click();const count=(await data()).items;
      await page.getByTestId(`combat-unit-${ally.key}`).locator('[aria-label]').first().click();
      assert.equal((await data()).bonus,true);assert.equal((await data()).items,count-1);
      assert.equal((await data()).acted,false,'Una acción adicional no gasta la acción de huida');
      await page.waitForTimeout(350);await flee();assert.equal((await data()).result,'fled');
      // Tocar un enemigo en tu turno le ataca con tu arma.
      await prepare({many:true});const foe=(await data()).units.find(u=>u.side==='enemy'&&u.row==='front');
      await page.getByTestId(`combat-unit-${foe.key}`).locator('[aria-label]').first().click();
      assert.equal((await data()).acted,true,'Tocar un enemigo ataca');
      assert.deepEqual(errors,[]);console.log(`PASS flujo ${width}x${height}: categorías, cancelación, objetivos, huida confirmada, doble toque, botón de fila y ataque tocando`);
      await page.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
