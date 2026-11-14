// Prueba de humo: monta las pantallas reales recorriendo una partida con la tienda de estado.
import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import App from '../App';
import { useStore } from '../src/store';
import { actionsFor, targetsFor, autoTurn } from '../src/engine/combat';

jest.mock('react-native-mmkv', () => {
  const m = new Map<string, string>();
  return { createMMKV: () => ({ set: (k: string, v: string) => m.set(k, v), getString: (k: string) => m.get(k), remove: (k: string) => m.delete(k) }) };
});
jest.mock('react-native-svg', () => {
  const R = require('react');
  const C = (name: string) => (p: any) => R.createElement(name, p, p.children);
  const names = ['Svg', 'Circle', 'ClipPath', 'Defs', 'G', 'Image', 'Pattern', 'Polygon', 'Rect', 'Path', 'Text', 'LinearGradient', 'Stop', 'Line'];
  const mod: any = { __esModule: true, default: C('Svg') };
  names.forEach(n => (mod[n] = C(n)));
  return mod;
});
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.useFakeTimers();

const texts = (r: ReactTestRenderer.ReactTestRenderer) => JSON.stringify(r.toJSON());

test('recorre título, creación, exploración y combate sin romperse', async () => {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => { r = ReactTestRenderer.create(<App />); });
  expect(texts(r)).toContain('Nueva partida');
  const S = useStore.getState;
  await act(async () => { S().pickSlot('new'); });
  await act(async () => { S().chooseNewSlot(1); });
  const tap = async (l: string) => act(async () => { r.root.findAllByProps({ accessibilityLabel: l })[0].props.onPress(); });
  await tap('Elegir especie');
  await tap('Elegir clase');
  await tap('Elegir atributos');
  await tap('Tirar dados');
  await act(async () => { jest.advanceTimersByTime(2000); });
  await tap('Poner nombre');
  await tap('Empezar la aventura');
  expect(S().screen).toBe('intro');
  expect(S().game!.party[0].cls).toBe('fighter');
  await act(async () => { S().enterDungeon(); });
  expect(S().screen).toBe('game');
  // La partida empieza en el pueblo: se entra en la mina con «Ir a la mazmorra».
  expect(S().game!.place).toBe('town');
  expect(texts(r)).toContain('Ir a la mazmorra');
  await act(async () => { S().leaveTown(); });
  // Diálogo de entrada y luego combate con las ratas.
  for (let i = 0; i < 10 && !S().combat; i++) await act(async () => { S().next(); });
  expect(S().combat).toBeDefined();
  // Pantalla de encuentro con la iniciativa.
  expect(texts(r)).toContain('Iniciativa');
  await act(async () => { r.root.findByProps({ accessibilityLabel: '¡A luchar!' }).props.onPress(); });
  // Juega el combate desde la interfaz de la tienda.
  let budgetSeen = false;
  for (let i = 0; i < 300 && S().combat && !S().combat!.result; i++) {
    const { game, combat } = S();
    if (autoTurn(combat!)) { await act(async () => { jest.advanceTimersByTime(1500); }); continue; }
    if (!budgetSeen) {
      // Cada símbolo de lo que queda del turno lleva su nombre al lado, en cualquier anchura.
      const budget = JSON.stringify(r.root.findByProps({ testID: 'combat-budget' }).findAllByType(require('react-native').Text).map(t => t.props.children));
      for (const l of ['Acción', 'Acción adicional', 'Movimiento']) expect(budget).toContain(`"${l}"`);
      budgetSeen = true;
    }
    const a = actionsFor(game!, combat!).find(x => x.target.startsWith('enemy') && targetsFor(combat!, x).length);
    await act(async () => { if (a) S().act(a, targetsFor(combat!, a)[0].key); });
    await act(async () => { if (S().combat && !S().combat!.result) S().endTurn(); });
  }
  expect(S().combat?.result).toBeDefined();
  expect(budgetSeen).toBe(true);
  await act(async () => { S().closeCombat(); });
  // Tras ganar vuelve al mapa; tras perder, pantalla de derrota.
  expect(['game', 'defeat']).toContain(S().screen);
  if (S().screen === 'game') {
    // Camina hacia una casilla visible del mapa.
    const { visibleCells, passable } = require('../src/engine/dungeon');
    const g = S().game!;
    const k = [...visibleCells(g)].find((x: string) => passable(g, g.zone).has(x) && !g.visited.includes(x)) as string | undefined;
    if (k) {
      await act(async () => { S().walkTo(k.split(',').map(Number) as [number, number]); });
      await act(async () => { jest.advanceTimersByTime(3000); });
    }
  }
  await act(async () => { S().go('title'); });
  await act(async () => { S().pickSlot('load'); });
  expect(texts(r)).toContain('Guerrero');
  // Pueblo, victoria y derrota también se montan.
  await act(async () => { S().loadSlot(1); });
  await act(async () => { S().edit(g => { g.place = 'town'; g.gold = 500; }); });
  expect(texts(r)).toContain('Valdescarcha');
  await act(async () => { S().go('victory'); });
  expect(texts(r)).toContain('Victoria');
  await act(async () => { S().go('defeat'); });
  expect(texts(r)).toContain('Derrota');
  await act(async () => { r.unmount(); });
}, 120000);

test('SUPERAR aparece solo en modo desarrollador y envía la elección con 20', async () => {
  const { Escena } = require('../src/ui/Escena');
  const { newGame } = require('../src/engine/game');
  const { enterZone } = require('../src/engine/dungeon');
  const { sceneById } = require('../src/engine/escenas');
  const { setDev } = require('../src/storage');
  const g = newGame(7, 'Prueba', 'fighter', 'human'); enterZone(g, 'z2');
  const scene = sceneById('z2_s02_pista');
  const choose = jest.fn();
  for (const dev of [false, true]) {
    setDev(dev);
    let r!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => { r = ReactTestRenderer.create(<Escena g={g} id={scene.id} onChoose={choose} onLeave={() => {}} />); });
    await act(async () => { r.root.findAllByProps({ accessibilityLabel: scene.options[0].label })[0].props.onPress(); });
    const buttons = r.root.findAllByProps({ accessibilityLabel: 'Superar (20)' });
    expect(buttons.length > 0).toBe(dev);
    if (dev) await act(async () => { buttons[0].props.onPress(); });
    await act(async () => { r.unmount(); });
  }
  expect(choose).toHaveBeenCalledWith(0, g.party[0].id, true);
  setDev(false);
});
