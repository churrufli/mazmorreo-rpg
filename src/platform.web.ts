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

/** Copia de seguridad: en la web se descarga como archivo. */
export const compartirCopia = async (texto: string, nombre: string) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
  a.download = `${nombre}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
/** Elegir un archivo de copia descargado antes. */
export const abrirCopia: (() => Promise<string | undefined>) | undefined = () => new Promise(resolve => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json,text/plain';
  input.onchange = () => { const f = input.files?.[0]; if (f) f.text().then(resolve, () => resolve(undefined)); else resolve(undefined); };
  input.click();
});
