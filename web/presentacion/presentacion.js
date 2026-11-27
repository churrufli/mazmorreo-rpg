// Mejora progresiva: todos los enlaces funcionan sin JavaScript.
// La barra superior se vuelve opaca al dejar atrás la portada.
const portada = document.querySelector('.portada');
const barra = document.querySelector('.barra');
if (portada && barra && 'IntersectionObserver' in window) {
  new window.IntersectionObserver(([e]) => barra.classList.toggle('opaca', !e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' }).observe(portada);
}

// Motas de luz sobre la portada, como las de la pantalla principal del juego (Particles en src/screens/Menu.tsx).
const capa = document.querySelector('.particulas');
if (capa && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const n = window.innerWidth < 720 ? 18 : 30;
  for (let i = 0; i < n; i++) {
    const m = document.createElement('span');
    const tam = 2 + Math.random() * 3;
    const dur = 7 + Math.random() * 7;
    m.className = 'mota';
    m.style.cssText = `left:${Math.random() * 100}%;width:${tam}px;height:${tam}px;--dur:${dur}s;--delay:${-Math.random() * dur}s;--deriva:${(Math.random() - 0.5) * 60}px;--alto:${capa.clientHeight}px`;
    capa.appendChild(m);
  }
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
