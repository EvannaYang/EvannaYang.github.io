(() => {
  const header = document.getElementById('site-header');
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    if (y <= 84 || y < lastY - 3) {
      header.classList.remove('is-hidden');
    } else if (y > lastY + 3) {
      header.classList.add('is-hidden');
    }
    lastY = y;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
})();
