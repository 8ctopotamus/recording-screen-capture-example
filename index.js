const videoElem = document.getElementById('video')
const logElem = document.getElementById('log')
const startElem = document.getElementById('start')
const stopElem = document.getElementById('stop')
const flipStreamElem = document.getElementById('flip-stream')

let webcamStream = null
let screenCaptureStream = null

const domLogger = {
  log(msg) { logElem.textContent = `${logElem.textContent}\n${msg}` },
  error(msg) { logElem.textContent = `${logElem.textContent}\nError: ${msg}` }
}

const displayMediaOptions = {
  video: {
    displaySurface: 'window',
  },
  audio: false,
}

function dumpOptionsInfo() {
  const videoTrack = videoElem.srcObject.getVideoTracks()[0]
  for (const logger of [console, domLogger]) {
    logger.log('Track settings')
    logger.log(JSON.stringify(videoTrack.getSettings(), null, 2))
    logger.log('Track constraints')
    logger.log(JSON.stringify(videoTrack.getConstraints(), null, 2))
  }
}

async function startCapture() {
  logElem.textContent = ''
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    videoElem.srcObject = webcamStream
    videoElem.load()
    videoElem.play()





    dumpOptionsInfo()
  } catch(err) {
    console.error(err)
    domLogger.error(err)
  }
}

const flipStream = async () => {
  if (!screenCaptureStream) {
    screenCaptureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
  }

  videoElem.srcObject = videoElem.srcObject === webcamStream ? screenCaptureStream : webcamStream
}

async function stopCapture() {
  // videoElem.tracks.forEach(track => track.stop())
  webcamStream.getVideoTracks().forEach(track => track.stop())
  screenCaptureStream.getVideoTracks().forEach(track => track.stop())
  
  videoElem.srcObject = null
  webcamStream = null
  screenCaptureStream = null
}

startElem.addEventListener('click', startCapture, false)
stopElem.addEventListener('click', stopCapture, false)
flipStreamElem.addEventListener('click', flipStream)

