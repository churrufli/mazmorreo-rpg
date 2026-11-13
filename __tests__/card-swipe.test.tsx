import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { PanResponder, PanResponderCallbacks, PanResponderGestureState } from 'react-native';
import { CardModal, charInfo } from '../src/ui/Card';
import { createHero } from '../src/engine/rules';

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


test('el deslizamiento horizontal alterna carta y ficha y respeta los gestos verticales', () => {
  let gestures!: PanResponderCallbacks;
  const original = PanResponder.create;
  const spy = jest.spyOn(PanResponder, 'create').mockImplementation(config => {
    gestures = config;
    return original(config);
  });
  const hero = createHero('Brakka', 'fighter', 'human');
  const close = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => { renderer = ReactTestRenderer.create(<CardModal char={hero} info={charInfo(hero)} onClose={close} />); });
  const state = (dx: number, dy: number, numberActiveTouches = 1) => ({ dx, dy, numberActiveTouches } as PanResponderGestureState);
  const capture = (dx: number, dy: number, fingers = 1) => gestures.onMoveShouldSetPanResponderCapture!({} as any, state(dx, dy, fingers));
  const release = (dx: number, dy: number) => act(() => { gestures.onPanResponderRelease!({} as any, state(dx, dy, 0)); jest.advanceTimersByTime(400); });
  const side = (label: string) => expect(renderer.root.findAllByProps({ accessibilityLabel: label }).length).toBeGreaterThan(0);
  expect(capture(60, 4)).toBe(true);
  expect(capture(-60, 4)).toBe(true);
  expect(capture(4, 60)).toBe(false);
  expect(capture(40, 40)).toBe(false);
  expect(capture(8, 0)).toBe(false);
  expect(capture(60, 4, 2)).toBe(false);
  side('Ver ficha');
  release(60, 4);
  side('Ver carta');
  release(2, 80);
  side('Ver carta');
  release(20, 0);
  side('Ver carta');
  release(-60, 4);
  side('Ver ficha');
  act(() => { renderer.root.findAllByProps({ accessibilityLabel: 'Ver ficha' })[0].props.onPress(); });
  side('Ver carta');
  expect(close).not.toHaveBeenCalled();
  act(() => renderer.unmount());
  spy.mockRestore();
});

test('la pestaña de ficha sigue al personaje y se conserva al volver a él', () => {
  const a = createHero('Alda', 'fighter', 'human');
  const b = createHero('Berta', 'wizard', 'elf');
  a.id = 'prueba-alda'; b.id = 'prueba-berta';
  let r!: ReactTestRenderer.ReactTestRenderer;
  const modal = (hero: typeof a) => <CardModal char={hero} info={charInfo(hero)} onClose={() => {}} />;
  act(() => { r = ReactTestRenderer.create(modal(a)); });
  const tabs = () => r.root.findAll(n => n.props.accessibilityRole === 'tab' && typeof n.props.onPress === 'function');
  const selected = () => tabs().filter(n => n.props.accessibilityState.selected).map(n => n.props.accessibilityLabel);
  act(() => { tabs()[2].props.onPress(); });
  expect(selected().join()).toContain('Inventario');
  act(() => { r.update(modal(b)); });
  expect(selected().join()).toContain('Ficha');
  act(() => { tabs()[1].props.onPress(); });
  expect(selected().join()).toContain('Habilidades');
  act(() => { r.update(modal(a)); });
  expect(selected().join()).toContain('Inventario');
  act(() => { r.unmount(); });
});
