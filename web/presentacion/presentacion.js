// Mejora progresiva: todos los enlaces funcionan sin JavaScript.
const portada = document.querySelector('.portada');
const barra = document.querySelector('.jugar-fijo');
const final = document.querySelector('.acceso-jugar');
if (portada && barra && final && 'IntersectionObserver' in window) {
  const movil = window.matchMedia('(max-width: 719px)');
  let portadaVisible = true;
  let finalVisible = false;
  const actualizar = () => {
    barra.hidden = !movil.matches || portadaVisible || finalVisible;
  };
  const observador = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (entrada.target === portada) portadaVisible = entrada.isIntersecting;
      if (entrada.target === final) finalVisible = entrada.isIntersecting;
    });
    actualizar();
  });
  observador.observe(portada);
  observador.observe(final);
  movil.addEventListener('change', actualizar);
}
