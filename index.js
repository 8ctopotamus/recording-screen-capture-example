const videoElem = document.getElementById('video')
const logElem = document.getElementById('log')
const startElem = document.getElementById('start')
const stopElem = document.getElementById('stop')
const flipStreamElem = document.getElementById('flip-stream')
const downloadElem = document.getElementById('downloadButton')

const maxRecordingTimeMS = 15000

let webcamStream = null
let screenStream = null
let audioStream = null
let mixedStream = null
let recorder = null
let shouldKeepWaiting = true
let canvas, ctx
let canvasStream

const domLogger = {
  log(msg) { logElem.textContent += `\n${msg}` },
  error(msg) { logElem.textContent += `\nError: ${msg}` }
}

function log(msg) {
  domLogger.log(msg)
}

function waitInterval(ms) {
  return new Promise((resolve) => {
    let countdown = ms / 1000
    const interval = setInterval(() => {
      countdown--
      if (countdown <= 0 || !shouldKeepWaiting) {
        clearInterval(interval)
        resolve()
      }
      log(`${countdown}s left...`)
    }, 1000)
  })
}

async function setupStreams() {
  screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
  webcamStream = await navigator.mediaDevices.getUserMedia({ video: true })
  audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
}

function setupCanvas() {
  const screenTrack = screenStream.getVideoTracks()[0].getSettings()
  canvas = document.createElement('canvas')
  canvas.width = screenTrack.width || 1280
  canvas.height = screenTrack.height || 720
  ctx = canvas.getContext('2d')
  canvasStream = canvas.captureStream(30) // 30fps

  // Merge audio into canvas stream
  audioStream.getAudioTracks().forEach(track => {
    canvasStream.addTrack(track)
  })
}

function drawToCanvas() {
  const screenVideo = document.createElement('video')
  const webcamVideo = document.createElement('video')

  screenVideo.srcObject = screenStream
  webcamVideo.srcObject = webcamStream
  screenVideo.muted = true
  webcamVideo.muted = true
  screenVideo.play()
  webcamVideo.play()

  function drawFrame() {
    ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(webcamVideo, canvas.width - 320, canvas.height - 240, 320, 240)
    requestAnimationFrame(drawFrame)
  }

  drawFrame()
}

async function startCapture() {
  logElem.textContent = ''
  shouldKeepWaiting = true

  try {
    await setupStreams()
    setupCanvas()
    drawToCanvas()

    videoElem.srcObject = canvasStream
    videoElem.play()

    const chunks = []
    recorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' })

    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.start()

    await waitInterval(maxRecordingTimeMS)

    if (recorder.state === 'recording') recorder.stop()

    const stopped = new Promise((res, rej) => {
      recorder.onstop = res
      recorder.onerror = evt => rej(evt.name)
    })

    await stopped

    const blob = new Blob(chunks, { type: 'video/webm' })
    const url = URL.createObjectURL(blob)

    videoElem.srcObject = null
    videoElem.src = url
    videoElem.controls = true
    videoElem.play()

    downloadElem.href = url
    downloadElem.download = 'recorded-video.webm'
    downloadElem.textContent = 'Download'
    log(`Recorded ${blob.size} bytes`)
  } catch (err) {
    domLogger.error(err)
  }
}

function stopCapture() {
  shouldKeepWaiting = false

  if (webcamStream) webcamStream.getTracks().forEach(t => t.stop())
  if (screenStream) screenStream.getTracks().forEach(t => t.stop())
  if (audioStream) audioStream.getTracks().forEach(t => t.stop())

  webcamStream = null
  screenStream = null
  audioStream = null
  mixedStream = null
  canvasStream = null
  recorder = null
  videoElem.srcObject = null
}

startElem.addEventListener('click', startCapture)
stopElem.addEventListener('click', stopCapture)

// Flip doesn't apply to canvas recording, so it's optional here
flipStreamElem.addEventListener('click', () => {
  log("Flip disabled in merged mode.")
})
