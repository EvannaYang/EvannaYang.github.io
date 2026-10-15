(() => {
  const video = document.querySelector('.laptop-model video');
  if (!video) return;

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) video.play().catch(() => {});
    else video.pause();
  }, { threshold: 0.1 });

  observer.observe(video);
})();
