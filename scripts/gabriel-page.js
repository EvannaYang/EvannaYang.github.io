(() => {
  const mediaItems = [...document.querySelectorAll('.animation-media')];
  function setPlayback(media, active) {
    if (active === (media.dataset.active === 'true')) return;
    media.dataset.active = String(active);
    if (media.dataset.ready !== 'true') return;

    const frame = media.querySelector('iframe');
    frame.contentWindow.postMessage({ type: 'gabriel-animation', action: active ? 'start' : 'stop' }, location.origin);
    media.classList.toggle('is-playing', active);
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) setPlayback(entry.target, entry.intersectionRatio >= 0.35);
  }, { threshold: [0, 0.35, 1] });

  for (const media of mediaItems) {
    const frame = media.querySelector('iframe');
    const markReady = () => {
      if (media.dataset.ready === 'true') return;
      media.dataset.ready = 'true';
      if (media.dataset.active === 'true') {
        frame.contentWindow.postMessage({ type: 'gabriel-animation', action: 'start' }, location.origin);
        media.classList.add('is-playing');
      }
    };
    frame.addEventListener('load', markReady);
    if (frame.contentDocument?.readyState === 'complete') markReady();
    observer.observe(media);
  }
})();
