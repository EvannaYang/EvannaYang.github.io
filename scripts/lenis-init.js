(() => {
  if (typeof Lenis === 'undefined') return;

  new Lenis({
    autoRaf: true,
    anchors: true,
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
  });
})();
