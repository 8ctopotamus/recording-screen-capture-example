const videoElem = document.getElementById('video')
const logElem = document.getElementById('log')
const startElem = document.getElementById('start')
const stopElem = document.getElementById('stop')

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
    videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
    dumpOptionsInfo()
  } catch(err) {
    console.error(err)
    domLogger.error(err)
  }
}

async function stopCapture() {
  const tracks = videoElem.tracks
  tracks.forEach(track => track.stop())
  videoElem.srcObject = null
}

startElem.addEventListener('click', startCapture, false)
stopElem.addEventListener('click', stopCapture, false)

