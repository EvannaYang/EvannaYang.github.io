// Each highlighted phrase owns its pointer state, so nearby text cannot respond.
const proximityPhrases = document.querySelectorAll('.proximity-text')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const radius = 90

proximityPhrases.forEach((phrase) => {
  const label = phrase.textContent
  phrase.setAttribute('aria-label', label)
  phrase.textContent = ''

  const letters = []
  label.split(' ').forEach((word, wordIndex) => {
    if (wordIndex) phrase.append(document.createTextNode(' '))
    const wordSpan = document.createElement('span')
    wordSpan.className = 'proximity-word'
    wordSpan.setAttribute('aria-hidden', 'true')

    for (const character of word) {
      const letter = document.createElement('span')
      letter.className = 'proximity-letter'
      letter.textContent = character
      wordSpan.append(letter)
      letters.push(letter)
    }
    phrase.append(wordSpan)
  })

  let centers = null
  let frame = 0
  let pointerX = 0
  let pointerY = 0

  function measure() {
    centers = letters.map((letter) => {
      const rect = letter.getBoundingClientRect()
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    })
  }

  function update() {
    frame = 0
    if (!centers) measure()
    letters.forEach((letter, index) => {
      const { x, y } = centers[index]
      const distance = Math.hypot(pointerX - x, pointerY - y)
      const amount = Math.max(0, 1 - distance / radius) ** 2
      letter.style.transform = amount < 0.001 ? '' : `scale(${(1 + amount * 0.08).toFixed(3)}, ${(1 + amount * 0.13).toFixed(3)})`
    })
  }

  function reset() {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    letters.forEach((letter) => { letter.style.transform = '' })
  }

  phrase.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || event.pointerType === 'touch') return
    pointerX = event.clientX
    pointerY = event.clientY
    if (!frame) frame = requestAnimationFrame(update)
  })
  phrase.addEventListener('pointerleave', reset)
  reducedMotion.addEventListener('change', reset)
  window.addEventListener('resize', () => { centers = null })
  window.addEventListener('scroll', () => { centers = null }, { passive: true })
})
