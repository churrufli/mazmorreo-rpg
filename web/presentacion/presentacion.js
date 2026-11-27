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
  const observador = new window.IntersectionObserver(entradas => {
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

// Cada bloque se oculta solo cuando este script lo vigila y aparece al entrar en pantalla (sin JavaScript se ve todo).
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revelar = new window.IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.replace('pendiente', 'revelado');
      revelar.unobserve(entrada.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.bloque > h2, .tira, .escritorio figure, .carta, .accesos').forEach(elemento => {
    elemento.classList.add('pendiente');
    revelar.observe(elemento);
  });
}
