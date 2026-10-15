(() => {
  const asset = '../assets/gabriel-tutorial/';
  const steps = [
    { title: 'Welcome to the <strong>Gabriel AI!</strong>', copy: 'lets start with a quick product tour and we will have you up and running in no time!', button: 'Get Started', box: [442, 222, 557, 455], mask: 'c64ad.svg', welcome: true },
    { title: 'Try a Search', copy: 'Ask Gabriel AI anything — search for campaigns, contacts and get insights instantly.', button: 'Next', box: [562, 153, 389, 172], mask: 'step2-f0340.svg', pointer: ['step2-208ff.svg', 440, 111, 122, 110.5] },
    { title: 'View Dashboard', copy: 'Your control center see recent activity, credits, and AI insights all in one place.', button: 'Next', box: [352, 170.08, 389, 172], mask: 'step3-991c1.svg', pointer: ['step3-34b2f.svg', 230, 128, 122, 110.58] },
    { title: 'Explore Analytics', copy: 'Track performance and measure engagement for every campaign you run.', button: 'Next', box: [352, 226.08, 389, 172], mask: 'step4-69bb9.svg', pointer: ['step4-34b2f.svg', 230, 184, 122, 110.58] },
    { title: 'Customize Voice', copy: 'Set up your brand’s voice so Gabriel AI speaks just like you.', button: 'Next', box: [352, 280.08, 389, 172], mask: 'step5-26a93.svg', pointer: ['step5-34b2f.svg', 230, 238, 122, 110.58] },
    { title: 'Create Campaign', copy: 'Launch your first campaign and connect with your audience today.', button: 'Create Campaign', box: [834, 124.08, 389, 172], mask: 'step6-bbdc4.svg', pointer: ['step6-ec511.svg', 1079, 55.5, 98, 78.5], final: true }
  ];

  const $ = id => document.getElementById(id);
  const canvas = $('canvas');
  const card = $('tour-card');
  const mask = $('mask');
  const pointer = $('pointer');
  const replay = $('replay');
  let autoplay = new URLSearchParams(location.search).get('autoplay') === '1';
  let stepIndex = 0;
  let autoplayTimer = 0;

  function fit() {
    const scale = Math.min(window.innerWidth / 1440, window.innerHeight / 900);
    canvas.style.transform = `scale(${scale})`;
    canvas.style.left = `${(window.innerWidth - 1440 * scale) / 2}px`;
    canvas.style.top = `${(window.innerHeight - 900 * scale) / 2}px`;
  }

  function show(index) {
    clearTimeout(autoplayTimer);
    stepIndex = index;
    const step = steps[index];
    card.hidden = false;
    mask.hidden = false;
    replay.hidden = true;
    card.classList.toggle('welcome', !!step.welcome);
    card.classList.toggle('final', !!step.final);
    const [left, top, width, height] = step.box;
    Object.assign(card.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
    $('tour-title').innerHTML = step.title;
    $('tour-copy').textContent = step.copy;
    $('next').textContent = step.button;
    mask.src = asset + step.mask;
    if (step.pointer) {
      const [file, x, y, w, h] = step.pointer;
      pointer.hidden = false;
      pointer.src = asset + file;
      Object.assign(pointer.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    } else {
      pointer.hidden = true;
    }
    if (autoplay) autoplayTimer = window.setTimeout(() => show((index + 1) % steps.length), index === 0 ? 1500 : 2700);
  }

  function close() {
    clearTimeout(autoplayTimer);
    card.hidden = true;
    mask.hidden = true;
    pointer.hidden = true;
    replay.hidden = false;
  }

  $('next').addEventListener('click', () => {
    if (stepIndex === steps.length - 1) close();
    else show(stepIndex + 1);
  });
  $('skip').addEventListener('click', close);
  replay.addEventListener('click', () => show(0));
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !card.hidden) close();
    if (event.key === 'ArrowRight' && !card.hidden) $('next').click();
  });
  window.addEventListener('resize', fit);
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.data?.type !== 'gabriel-animation') return;
    if (event.data.action === 'stop') { autoplay = false; clearTimeout(autoplayTimer); }
    if (event.data.action === 'start') { autoplay = true; show(0); }
  });
  fit();
  show(0);
})();
