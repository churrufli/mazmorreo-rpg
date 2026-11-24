import React, { useEffect, useState } from 'react';
import { AppState, Platform, StatusBar, View } from 'react-native';
import { SafeAreaInsetsContext, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler } from './src/platform';
import { C } from './src/theme';
import { useStore } from './src/store';
import { Create, Intro, Slots, Title } from './src/screens/Menu';
import { Explore } from './src/screens/Explore';
import { Combat } from './src/screens/Combat';
import { Defeat, Town, Victory } from './src/screens/Town';
import { FadeIn, Message } from './src/ui/Overlays';
import { Btn } from './src/ui/kit';
import { OptionsButton } from './src/ui/Settings';
import { useEscritorio } from './src/ui/escritorio';
import * as storage from './src/storage';
import { startSound } from './src/sonido';

startSound();

/** Último toque en la pantalla: sin tocar en 3 minutos no cuenta el tiempo jugado (y la pantalla se puede apagar). */
let lastTouch = Date.now();
const IDLE_MS = 3 * 60 * 1000;

/** Pantallas con su propio botón de ajustes (título, mapa, combate y pueblo) o sin él (final de aventura). */
const OWN_GEAR = new Set<string>(['title', 'game', 'victory']);

function Router() {
  const ins = useSafeAreaInsets();
  const esc = useEscritorio();
  const screen = useStore(s => s.screen);
  const game = useStore(s => s.game);
  const combat = useStore(s => s.combat);
  const go = useStore(s => s.go);
  const ending = useStore(s => s.ending);
  const showEnding = useStore(s => s.showEnding);

  const [askExit, setAskExit] = useState(false);
  // Contador de tiempo jugado: suma solo con una partida abierta y la app delante. Se guarda con la partida.
  const playing = !!game && screen !== 'title' && screen !== 'slots' && screen !== 'create';
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      const g = useStore.getState().game;
      // Y alguien ha tocado la pantalla en los últimos 3 minutos (el autor 2026-11-06).
      if (g && AppState.currentState === 'active' && Date.now() - lastTouch < IDLE_MS) g.playMs = (g.playMs ?? 0) + 5000;
    }, 5000);
    return () => clearInterval(t);
  }, [playing]);
  const [askQuit, setAskQuit] = useState(false);
  const inAdventure = screen === 'game' || screen === 'intro';
  // Botón Atrás de Android: en el título pregunta antes de cerrar el juego; en una aventura pregunta antes de salir.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'title') {
        if (Platform.OS === 'web') return false;
        setAskQuit(a => !a);
        return true;
      }
      if (inAdventure) setAskExit(a => !a);
      // Final repetido desde el diario: Atrás vuelve al pueblo.
      else if (screen === 'victory' && ending) showEnding();
      else go(screen === 'create' ? 'slots' : 'title');
      return true;
    });
    return () => sub.remove();
  }, [screen, inAdventure, go, ending, showEnding]);
  const exit = () => {
    // Fuera de combate se guarda dónde está el grupo; en combate se vuelve al último guardado.
    if (screen === 'game' && game && !combat) storage.save(game);
    setAskExit(false);
    go('title');
  };

  // Cada cambio de pantalla entra con un fundido suave.
  let key: string = screen;
  let el: React.ReactElement;
  if (screen === 'title') el = <Title />;
  else if (screen === 'slots') el = <Slots />;
  else if (screen === 'create') el = <Create />;
  else if (screen === 'intro') el = <Intro />;
  else if (screen === 'victory') el = <Victory />;
  else if (screen === 'defeat') el = <Defeat />;
  else if (combat) { key = `combat:${combat.encounters.join()}`; el = <Combat />; }
  else if (game?.place === 'town') { key = 'town'; el = <Town />; }
  else el = <Explore />;
  return (
    <>
      <FadeIn key={key} from={0} duration={800} style={{ flex: 1 }}>{el}</FadeIn>
      {askExit && inAdventure ? (
        <Message title="¿Quieres salir de la aventura?" lines={[combat ? 'Estás en pleno combate: al volver, seguirás desde el último guardado.' : 'Se guardará la partida en este punto.']}>
          <Btn label="Salir" onPress={exit} />
          <Btn primary label="Seguir jugando" onPress={() => setAskExit(false)} />
        </Message>
      ) : null}
      {askQuit && screen === 'title' ? (
        <Message title="¿Quieres salir de Mazmorreo?" lines={['Las partidas guardadas se conservan.']}>
          <Btn label="Salir" onPress={() => { setAskQuit(false); BackHandler.exitApp(); }} />
          <Btn primary label="Seguir jugando" onPress={() => setAskQuit(false)} />
        </Message>
      ) : null}
      {/* Pantallas sin rueda de ajustes propia: el botón de opciones flota arriba a la derecha. */}
      {OWN_GEAR.has(screen) ? null : <OptionsButton style={{ position: 'absolute', top: ins.top + 8, right: esc.on ? (esc.width - esc.col) / 2 + 12 : 12, padding: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.55)' }} />}
    </>
  );
}

/** Reserva espacio para los controles web dentro de cada pantalla, sin recortar sus fondos. */
function GameInsets({ top, children }: { top: number; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const value = React.useMemo(() => ({ ...insets, top: insets.top + top }), [insets, top]);
  return <SafeAreaInsetsContext.Provider value={value}>{children}</SafeAreaInsetsContext.Provider>;
}

export default function App({ topInset = 0 }: { topInset?: number } = {}) {
  return (
    <SafeAreaProvider>
      <GameInsets top={topInset}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={{ flex: 1, backgroundColor: C.bg }} onStartShouldSetResponderCapture={() => { lastTouch = Date.now(); return false; }}>
          <Router />
        </View>
      </GameInsets>
    </SafeAreaProvider>
  );
}
