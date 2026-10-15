const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function smoothstep(from, to, value) {
  const progress = clamp((value - from) / Math.max(0.0001, to - from));
  return progress * progress * (3 - 2 * progress);
}

function storyProgress(root, stage) {
  const rootRect = root.getBoundingClientRect();
  const stageTop = Number.parseFloat(getComputedStyle(stage).top) || 0;
  const range = Math.max(1, root.offsetHeight - stage.offsetHeight);
  return clamp((stageTop - rootRect.top) / range);
}

function applyWeights(items, weights, activeIndex) {
  items.forEach((item, index) => {
    const weight = clamp(weights[index] || 0);
    item.style.opacity = String(weight);
    item.style.visibility = weight > 0.001 ? 'visible' : 'hidden';
    item.classList.toggle('is-active', index === activeIndex);
  });
}

function applyActive(items, activeIndex) {
  items.forEach((item, index) => {
    const isActive = index === activeIndex;
    item.style.opacity = isActive ? '1' : '0';
    item.style.visibility = isActive ? 'visible' : 'hidden';
    item.classList.toggle('is-active', isActive);
  });
}

const chapters = [...document.querySelectorAll('[data-chapter]')];
const railItems = [...document.querySelectorAll('[data-rail]')];
const chapterRail = document.querySelector('.chapter-rail');
const heroMotion = document.querySelector('[data-hero-motion]');
const videos = [...document.querySelectorAll('video')];
const tuiStory = document.querySelector('[data-scroll-story="tui"]');
const iterationStory = document.querySelector('[data-scroll-story="iteration"]');
const decisionStory = document.querySelector('[data-scroll-story="decisions"]');

let syncRailAnimation = () => {};

if (chapterRail && railItems.length) {
  const targets = railItems.map(() => 0);
  const current = railItems.map((item) => item.classList.contains('is-active') ? 1 : 0);
  const centers = railItems.map(() => 0);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let railFrame = 0;
  let lastFrame = performance.now();
  let railTop = 0;

  const measureRail = () => {
    railTop = chapterRail.getBoundingClientRect().top;
    railItems.forEach((item, index) => {
      centers[index] = item.offsetTop + item.offsetHeight / 2;
    });
  };

  const animateRail = (now) => {
    const delta = Math.min((now - lastFrame) / 1000, 0.05);
    const easing = 1 - Math.exp(-delta / 0.09);
    let moving = false;
    lastFrame = now;

    railItems.forEach((item, index) => {
      const target = Math.max(targets[index], item.classList.contains('is-active') ? 1 : 0);
      const next = reduceMotion ? target : current[index] + (target - current[index]) * easing;
      current[index] = Math.abs(target - next) < 0.001 ? target : next;
      item.style.setProperty('--effect', current[index].toFixed(4));
      if (current[index] !== target) moving = true;
    });

    railFrame = moving ? requestAnimationFrame(animateRail) : 0;
  };

  const startRailAnimation = () => {
    if (railFrame) return;
    lastFrame = performance.now();
    railFrame = requestAnimationFrame(animateRail);
  };

  syncRailAnimation = startRailAnimation;

  chapterRail.addEventListener('pointerenter', measureRail, { passive: true });

  chapterRail.addEventListener('pointermove', (event) => {
    const pointerY = event.clientY - railTop;
    railItems.forEach((_, index) => {
      const distance = Math.abs(pointerY - centers[index]);
      const proximity = clamp(1 - distance / 84);
      targets[index] = proximity * proximity * (3 - 2 * proximity);
    });
    startRailAnimation();
  }, { passive: true });

  chapterRail.addEventListener('pointerleave', () => {
    targets.fill(0);
    startRailAnimation();
  });

  chapterRail.addEventListener('focusin', (event) => {
    const index = railItems.indexOf(event.target.closest('[data-rail]'));
    if (index < 0) return;
    targets.fill(0);
    targets[index] = 1;
    startRailAnimation();
  });

  chapterRail.addEventListener('focusout', (event) => {
    if (chapterRail.contains(event.relatedTarget)) return;
    targets.fill(0);
    startRailAnimation();
  });

  window.addEventListener('resize', measureRail, { passive: true });
  measureRail();
  startRailAnimation();
}

const chapterObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (!visible) return;

  const chapter = visible.target.dataset.chapter;
  railItems.forEach((item) => {
    const isActive = item.dataset.rail === chapter;
    item.classList.toggle('is-active', isActive);
    if (isActive) item.setAttribute('aria-current', 'location');
    else item.removeAttribute('aria-current');
  });
  syncRailAnimation();
  document.body.classList.toggle('on-dark', visible.target.classList.contains('decisions'));
}, {
  rootMargin: '-28% 0px -42% 0px',
  threshold: [0, 0.2, 0.5, 0.8]
});

chapters.forEach((chapter) => chapterObserver.observe(chapter));

const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
      entry.target.play().catch(() => {});
    } else if (entry.intersectionRatio < 0.15) {
      entry.target.pause();
    }
  });
}, { threshold: [0, 0.15, 0.4, 0.75] });

videos.forEach((video) => videoObserver.observe(video));

if (heroMotion) {
  const heroObserver = new IntersectionObserver((entries, observer) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    heroMotion.classList.add('is-revealed');
    observer.unobserve(heroMotion);
  }, { threshold: 0.25 });

  heroObserver.observe(heroMotion);
}

function updateTuiStory() {
  if (!tuiStory || tuiStory.offsetParent === null) return;

  const stage = tuiStory.querySelector('.scroll-story-stage');
  const copies = [...tuiStory.querySelectorAll('[data-story-copy]')];
  const after = tuiStory.querySelector('.tui-after');
  const tint = tuiStory.querySelector('.tui-tint');
  const notes = [...tuiStory.querySelectorAll('[data-tui-note]')];
  const shapes = [...tuiStory.querySelectorAll('[data-tui-shape]')];
  const lines = [...tuiStory.querySelectorAll('[data-tui-line]')];
  const progress = storyProgress(tuiStory, stage);
  const enterAnalysis = smoothstep(0.1, 0.16, progress);
  const enterAfter = smoothstep(0.74, 0.82, progress);
  const activeCopy = progress < 0.13 ? 0 : progress < 0.78 ? 1 : 2;
  applyActive(copies, activeCopy);

  const annotationFade = 1 - smoothstep(0.68, 0.78, progress);
  const starts = [0.16, 0.34, 0.52];

  starts.forEach((start, index) => {
    const shapeProgress = smoothstep(start, start + 0.07, progress);
    const lineProgress = smoothstep(start + 0.05, start + 0.12, progress);
    const noteProgress = smoothstep(start + 0.1, start + 0.18, progress);
    shapes[index].style.strokeDashoffset = String(1 - shapeProgress);
    shapes[index].style.opacity = String(shapeProgress * annotationFade);
    lines[index].style.opacity = String(lineProgress * annotationFade);
    notes[index].style.opacity = String(noteProgress * annotationFade);
  });

  tint.style.opacity = String(smoothstep(0.11, 0.2, progress) * annotationFade);
  after.style.opacity = String(enterAfter);
}

function updateIterationStory() {
  if (!iterationStory || iterationStory.offsetParent === null) return;

  const stage = iterationStory.querySelector('.scroll-story-stage');
  const cards = [...iterationStory.querySelectorAll('[data-iteration-card]')];
  const copies = [...iterationStory.querySelectorAll('[data-iteration-copy]')];
  const progressItems = [...iterationStory.querySelectorAll('.iteration-progress span')];
  const progress = storyProgress(iterationStory, stage);
  const position = progress * (cards.length - 1);
  const currentIndex = Math.min(Math.floor(position), cards.length - 1);
  const nextIndex = Math.min(currentIndex + 1, cards.length - 1);
  const stateProgress = position - currentIndex;
  const transition = smoothstep(0.42, 0.58, stateProgress);
  const activeIndex = transition < 0.5 ? currentIndex : nextIndex;
  applyActive(copies, activeIndex);

  cards.forEach((card, index) => {
    const relative = position - index;
    let transform = 'translate3d(0, 100%, 0) scale(1)';
    let visible = false;

    if (relative >= 0) {
      const depth = Math.max(0, relative);
      const translateY = Math.round(-depth * 26 * 100) / 100;
      const scale = Math.round(Math.max(0.89, 1 - depth * 0.034) * 1000) / 1000;
      transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
      visible = true;
    } else if (relative >= -1) {
      const futureDepth = clamp(-relative);
      const translateY = Math.round(smoothstep(0, 1, futureDepth) * 1000) / 10;
      transform = `translate3d(0, ${translateY}%, 0) scale(1)`;
      visible = true;
    }

    card.style.transform = transform;
    card.style.visibility = visible ? 'visible' : 'hidden';
  });

  progressItems.forEach((item, index) => item.classList.toggle('is-active', index === activeIndex));
}

function updateDecisionStory() {
  if (!decisionStory || decisionStory.offsetParent === null) return;

  const stage = decisionStory.querySelector('.scroll-story-stage');
  const copies = [...decisionStory.querySelectorAll('[data-decision-copy]')];
  const panels = [...decisionStory.querySelectorAll('[data-decision-panel]')];
  const progressItems = [...decisionStory.querySelectorAll('.decision-progress span')];
  const progress = storyProgress(decisionStory, stage);
  const visualStates = [0, 1, 1, 2];
  const position = progress * (panels.length - 1);
  const currentPanel = Math.min(Math.floor(position), panels.length - 1);
  const nextPanel = Math.min(currentPanel + 1, panels.length - 1);
  const stateProgress = position - currentPanel;
  const transition = smoothstep(0.42, 0.58, stateProgress);
  const panelWeights = panels.map(() => 0);
  panelWeights[currentPanel] = 1 - transition;
  panelWeights[nextPanel] += transition;

  const currentCopy = visualStates[currentPanel];
  const nextCopy = visualStates[nextPanel];
  const activePanel = transition < 0.5 ? currentPanel : nextPanel;
  const activeCopy = transition < 0.5 ? currentCopy : nextCopy;
  applyWeights(panels, panelWeights, activePanel);
  applyActive(copies, activeCopy);
  progressItems.forEach((item, index) => item.classList.toggle('is-active', index === activePanel));
}

let frameRequested = false;

function updateScrollStories() {
  frameRequested = false;
  updateTuiStory();
  updateIterationStory();
  updateDecisionStory();
}

function requestStoryUpdate() {
  if (frameRequested) return;
  frameRequested = true;
  window.requestAnimationFrame(updateScrollStories);
}

window.addEventListener('scroll', requestStoryUpdate, { passive: true });
window.addEventListener('resize', requestStoryUpdate);
window.addEventListener('load', requestStoryUpdate);
requestStoryUpdate();
