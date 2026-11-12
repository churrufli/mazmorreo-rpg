export const ToastAndroid = { SHORT: 0, show: (_message: string, _duration: number) => {} };
export const BackHandler = {
  addEventListener(_name: string, handler: () => boolean) {
    const onKey = (event: KeyboardEvent) => {
      // Escape se reserva primero para salir de pantalla completa.
      if (event.key === 'Escape' && !document.fullscreenElement && handler()) event.preventDefault();
    };
    const onBack = () => handler();
    window.addEventListener('keydown', onKey);
    window.addEventListener('mazmorreo:back', onBack);
    return { remove() {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mazmorreo:back', onBack);
    } };
  },
};
