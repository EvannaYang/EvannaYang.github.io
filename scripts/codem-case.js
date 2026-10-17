const bounceStage = document.querySelector('.bounce-stage');
if (bounceStage) {
  const viewport = bounceStage.parentElement;
  const resizeStage = () => viewport.style.setProperty('--stage-scale', Math.min(1, viewport.clientWidth / 1280));
  new ResizeObserver(resizeStage).observe(viewport);
  resizeStage();
  const cards = [...bounceStage.querySelectorAll('.bounce-card')];
  const activate = (index) => {
    bounceStage.classList.add('has-hover');
    cards.forEach((card, i) => card.style.setProperty('--push', `${i < index ? -160 : i > index ? 160 : 0}px`));
  };
  const clear = () => bounceStage.classList.remove('has-hover');
  cards.forEach((card, i) => {
    card.addEventListener('mouseenter', () => activate(i));
    card.addEventListener('focus', () => activate(i));
    card.addEventListener('blur', clear);
  });
  bounceStage.addEventListener('mouseleave', clear);
}

const embeds = [
  ['.landing-live-window', 1280],
  ['.landing-live', 1307],
  ['.admin-window', 1440],
];
for (const [selector, sourceWidth] of embeds) {
  const window = document.querySelector(selector);
  if (!window) continue;
  const resize = () => {
    const scale = window.clientWidth / sourceWidth;
    window.style.setProperty('--embed-scale', scale);
    if (selector === '.landing-live-window') {
      window.style.setProperty('--embed-height', `${Math.ceil(window.clientHeight / scale)}px`);
    }
  };
  new ResizeObserver(resize).observe(window);
  resize();
}

const landingScrollRegion = document.querySelector('.landing-scroll-region');
const landingWell = landingScrollRegion?.querySelector('.landing-well');
if (landingScrollRegion && landingWell) {
  const liveFrame = landingWell.querySelector('.landing-live-window iframe');
  const liveOrigin = 'https://codem.feishu.cn';
  let liveBridgeReady = false;

  window.addEventListener('message', (event) => {
    if (event.source !== liveFrame.contentWindow || event.origin !== liveOrigin) return;
    if (event.data?.type !== 'codem-portfolio:ready') return;
    liveBridgeReady = true;
    landingWell.classList.add('has-scroll-bridge');
  });
  liveFrame.addEventListener('load', () => {
    liveBridgeReady = false;
    landingWell.classList.remove('has-scroll-bridge');
    liveFrame.contentWindow.postMessage({ type: 'codem-portfolio:ping' }, liveOrigin);
  });

  landingWell.addEventListener('wheel', (event) => {
    if (!liveBridgeReady) return;
    event.preventDefault();
    event.stopPropagation();
    liveFrame.contentWindow.postMessage({
      type: 'codem-portfolio:scroll',
      deltaY: event.deltaY,
      deltaMode: event.deltaMode,
    }, liveOrigin);
  }, { passive: false, capture: true });

  let queued = false;
  const positionLanding = () => {
    queued = false;
    if (window.innerWidth >= 1280) {
      landingWell.style.transform = '';
      return;
    }
    const pinTop = window.innerWidth <= 620 ? 76 : 88;
    const shift = Math.max(0, Math.min(
      Math.round(pinTop - landingScrollRegion.getBoundingClientRect().top),
      landingScrollRegion.offsetHeight - landingWell.offsetHeight,
    ));
    landingWell.style.transform = `translateY(${shift}px)`;
  };
  const scheduleLanding = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(positionLanding);
  };
  window.addEventListener('scroll', scheduleLanding, { passive: true });
  window.addEventListener('resize', scheduleLanding);
  scheduleLanding();
}
