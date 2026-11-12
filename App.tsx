import React, { useEffect, useRef, useState } from 'react';
import { AppState, StatusBar, View } from 'react-native';
import { SafeAreaInsetsContext, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler, ToastAndroid } from './src/platform';
import { C } from './src/theme';
import { useStore } from './src/store';
import { Create, Intro, Slots, Title } from './src/screens/Menu';
import { Explore } from './src/screens/Explore';
import { Combat } from './src/screens/Combat';
import { Defeat, Town, Victory } from './src/screens/Town';
import { FadeIn, Message } from './src/ui/Overlays';
import { Btn } from './src/ui/kit';
import * as storage from './src/storage';
import { startSound } from './src/sonido';

startSound();

/** Último toque en la pantalla: sin tocar en 3 minutos no cuenta el tiempo jugado (y la pantalla se puede apagar). */
let lastTouch = Date.now();
const IDLE_MS = 3 * 60 * 1000;

function Router() {
  const screen = useStore(s => s.screen);
  const game = useStore(s => s.game);
  const combat = useStore(s => s.combat);
  const go = useStore(s => s.go);

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
  const lastBack = useRef(0);
  const inAdventure = screen === 'game' || screen === 'intro';
  // Botón Atrás de Android: en el título hay que pulsarlo dos veces para salir; en una aventura pregunta antes de salir.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'title') {
        if (Date.now() - lastBack.current < 2000) return false;
        lastBack.current = Date.now();
        ToastAndroid.show('Pulsa otra vez Atrás para salir', ToastAndroid.SHORT);
        return true;
      }
      if (inAdventure) setAskExit(a => !a);
      else go(screen === 'create' ? 'slots' : 'title');
      return true;
    });
    return () => sub.remove();
  }, [screen, inAdventure, go]);
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
