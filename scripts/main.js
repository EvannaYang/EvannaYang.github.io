const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

function smoothstep(from, to, value) {
  const progress = clamp((value - from) / Math.max(0.0001, to - from))
  return progress * progress * (3 - 2 * progress)
}

function storyProgress(root, stage) {
  const rootRect = root.getBoundingClientRect()
  const stageTop = Number.parseFloat(getComputedStyle(stage).top) || 0
  const range = Math.max(1, root.offsetHeight - stage.offsetHeight)
  return clamp((stageTop - rootRect.top) / range)
}

const tuiStory = document.querySelector('[data-scroll-story="tui"]')
const iterationStory = document.querySelector('[data-scroll-story="iteration"]')
const decisionStory = document.querySelector('[data-scroll-story="decisions"]')

const motionVideos = Array.from(document.querySelectorAll('[data-motion-video]'))

function playMotionVideo(video, restart = false) {
  if (restart) video.currentTime = 0
  const playAttempt = video.play()
  if (playAttempt) playAttempt.catch(() => {})
}

motionVideos.forEach((video) => {
  const replayButton = video.parentElement.querySelector('[data-motion-replay]')
  replayButton?.addEventListener('click', () => playMotionVideo(video, true))
})

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target

      if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
        playMotionVideo(video)
      } else if (entry.intersectionRatio < 0.15) {
        video.pause()
        if (video.dataset.motionVideo === 'once') video.currentTime = 0
      }
    })
  }, { threshold: [0, 0.15, 0.45, 0.75] })

  motionVideos.forEach((video) => videoObserver.observe(video))
}

function updateTuiStory() {
  if (!tuiStory || tuiStory.offsetParent === null) return

  const stage = tuiStory.querySelector('.tui-story-stage')
  const after = tuiStory.querySelector('.tui-after')
  const tint = tuiStory.querySelector('.tui-tint')
  const notes = Array.from(tuiStory.querySelectorAll('[data-tui-note]'))
  const shapes = Array.from(tuiStory.querySelectorAll('[data-tui-shape]'))
  const lines = Array.from(tuiStory.querySelectorAll('[data-tui-line]'))
  const statusIndex = tuiStory.querySelector('.story-status-index')
  const statusLabel = tuiStory.querySelector('.story-status-label')
  const progress = storyProgress(tuiStory, stage)
  const annotationFade = 1 - smoothstep(0.68, 0.78, progress)
  const starts = [0.08, 0.28, 0.48]

  starts.forEach((start, index) => {
    const shapeProgress = smoothstep(start, start + 0.08, progress)
    const lineProgress = smoothstep(start + 0.06, start + 0.13, progress)
    const noteProgress = smoothstep(start + 0.12, start + 0.2, progress)
    const noteOpacity = noteProgress * annotationFade

    shapes[index].style.strokeDashoffset = String(1 - shapeProgress)
    shapes[index].style.opacity = String(shapeProgress * annotationFade)
    lines[index].style.opacity = String(lineProgress * annotationFade)
    notes[index].style.opacity = String(noteOpacity)
  })

  const analysisProgress = smoothstep(0.04, 0.16, progress) * annotationFade
  tint.style.opacity = String(analysisProgress)

  const afterProgress = smoothstep(0.76, 0.92, progress)
  after.style.opacity = String(afterProgress)

  if (progress < 0.1) {
    statusIndex.textContent = '01'
    statusLabel.textContent = 'Initial GUI assumption'
  } else if (progress < 0.76) {
    statusIndex.textContent = '02'
    statusLabel.textContent = 'Terminal constraints'
  } else {
    statusIndex.textContent = '03'
    statusLabel.textContent = 'Terminal-native translation'
  }
}

function updateIterationStory() {
  if (!iterationStory || iterationStory.offsetParent === null) return

  const stage = iterationStory.querySelector('.iteration-story-stage')
  const cards = Array.from(iterationStory.querySelectorAll('[data-iteration-card]'))
  const progressItems = Array.from(iterationStory.querySelectorAll('.iteration-progress span'))
  const activeCaption = iterationStory.querySelector('.iteration-active-caption')
  const activeCaptionIndex = activeCaption.querySelector('.iteration-active-index')
  const activeCaptionLabel = activeCaption.querySelector('.iteration-active-label')
  const progress = storyProgress(iterationStory, stage)
  const position = progress * (cards.length - 1)
  const activeIndex = Math.min(Math.round(position), cards.length - 1)

  cards.forEach((card, index) => {
    const relative = position - index
    let transform = 'translate3d(0, 100%, 0)'
    let visible = false

    if (relative >= 0) {
      const depth = Math.max(0, relative)
      const translateY = Math.round(-depth * 28 * 100) / 100
      const scale = Math.round(Math.max(0.88, 1 - depth * 0.035) * 1000) / 1000
      transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`
      visible = true
    } else if (relative >= -1) {
      const futureDepth = clamp(-relative, 0, 1)
      const translateY = Math.round(smoothstep(0, 1, futureDepth) * 1000) / 10
      transform = `translate3d(0, ${translateY}%, 0) scale(1)`
      visible = true
    }

    if (card.dataset.scrollTransform !== transform) {
      card.style.transform = transform
      card.dataset.scrollTransform = transform
    }

    const visibility = visible ? 'visible' : 'hidden'
    if (card.style.visibility !== visibility) {
      card.style.visibility = visibility
    }
  })

  progressItems.forEach((item, index) => {
    item.classList.toggle('is-active', index === activeIndex)
  })

  if (activeCaption.dataset.activeIndex !== String(activeIndex)) {
    const sourceCaption = cards[activeIndex].querySelector('figcaption')
    activeCaptionIndex.textContent = sourceCaption.querySelector('span').textContent
    activeCaptionLabel.textContent = sourceCaption.textContent.replace(/^\s*\d+\s*/, '').trim()
    activeCaption.dataset.activeIndex = String(activeIndex)
  }
}

function updateDecisionStory() {
  if (!decisionStory) return

  const storyStage = decisionStory.querySelector('.decision-story-stage')
  const prototypeStage = decisionStory.querySelector('.decision-stage')
  if (!storyStage || !prototypeStage || getComputedStyle(prototypeStage).display === 'none') return

  const steps = Array.from(decisionStory.querySelectorAll('[data-decision-step]'))
  const panels = Array.from(decisionStory.querySelectorAll('[data-decision-panel]'))
  const progressItems = Array.from(decisionStory.querySelectorAll('.decision-progress span'))
  const progress = storyProgress(decisionStory, storyStage)
  const visualStates = [0, 1, 1, 2]
  const position = clamp((progress - 0.08) / 0.84) * (panels.length - 1)
  const currentPanel = Math.min(Math.floor(position), panels.length - 1)
  const nextPanel = Math.min(currentPanel + 1, panels.length - 1)
  const stateProgress = position - currentPanel
  const panelTransition = smoothstep(0.42, 0.58, stateProgress)
  const panelWeights = panels.map(() => 0)

  panelWeights[currentPanel] = 1 - panelTransition
  panelWeights[nextPanel] += panelTransition

  const currentStep = visualStates[currentPanel]
  const nextStep = visualStates[nextPanel]
  const stepWeights = steps.map(() => 0)

  if (currentStep === nextStep) {
    stepWeights[currentStep] = 1
  } else {
    stepWeights[currentStep] = 1 - smoothstep(0.42, 0.5, stateProgress)
    stepWeights[nextStep] = smoothstep(0.5, 0.58, stateProgress)
  }

  const activePanel = panelTransition < 0.5 ? currentPanel : nextPanel
  const activeStep = stateProgress < 0.5 ? currentStep : nextStep

  const entryProgress = smoothstep(0, 0.06, progress)
  const exitProgress = smoothstep(0.94, 1, progress)
  const stageOpacity = entryProgress * (1 - exitProgress)
  const stageOffset = (1 - entryProgress) * 28 - exitProgress * 28

  storyStage.style.setProperty('--decision-stage-opacity', String(stageOpacity))
  storyStage.style.setProperty('--decision-stage-offset', `${stageOffset}px`)

  steps.forEach((step, index) => {
    const weight = clamp(stepWeights[index])
    step.style.opacity = String(weight)
    step.style.visibility = weight > 0.001 ? 'visible' : 'hidden'
    step.classList.toggle('is-active', index === activeStep)
  })

  panels.forEach((panel, index) => {
    const weight = clamp(panelWeights[index])
    panel.style.opacity = String(weight)
    panel.style.visibility = weight > 0.001 ? 'visible' : 'hidden'
    panel.classList.toggle('is-active', index === activePanel)
  })

  progressItems.forEach((item, index) => {
    item.classList.toggle('is-active', index === activePanel)
  })
}

let frameRequested = false

function updateScrollStories() {
  frameRequested = false
  updateTuiStory()
  updateIterationStory()
  updateDecisionStory()
}

function requestStoryUpdate() {
  if (frameRequested) return
  frameRequested = true
  window.requestAnimationFrame(updateScrollStories)
}

window.addEventListener('scroll', requestStoryUpdate, { passive: true })
window.addEventListener('resize', requestStoryUpdate)
window.addEventListener('load', requestStoryUpdate)
requestStoryUpdate()
