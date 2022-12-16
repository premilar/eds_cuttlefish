// jake starts at https://docs.opencv.org/3.4.2/dd/d00/tutorial_js_video_display.html

// let's see ...

const OPENCV_URL = 'opencv.js'

let loadOpenCv = () => {
  return new Promise((resolve, reject) => {
    let script = document.createElement('script')
    script.setAttribute('async', '')
    script.setAttribute('type', 'text/javascript')
    script.addEventListener('load', () => {
      resolve()
    })
    script.addEventListener('error', (err) => {
      console.error('failed to load script', err)
      reject(err)
    })
    script.src = OPENCV_URL
    let node = document.getElementsByTagName('script')[0]
    node.parentNode.insertBefore(script, node)
  })
}

loadOpenCv().then(() => {
  console.log('cv ok, starting camera')
  return startCamera()
}).then(() => {
  console.log('camera up (?), go for cv')
  go()
}).catch((err) => {
  console.error(err)
})

let go = () => {
  let video = document.getElementById('videoInput')
  // pull from here,
  let cap = new cv.VideoCapture(video)
  // src: the initial image,
  let src = new cv.Mat(video.height, video.width, cv.CV_8UC4)
  let red = new cv.Mat(video.height, video.width, cv.CV_8UC1)
  // then
  // to pull between,
  let low = new cv.Mat(video.height, video.width, cv.CV_8UC4, [50, 0, 0, 0])
  let hgh = new cv.Mat(video.height, video.width, cv.CV_8UC4, [255, 50, 50, 255])
  // and a dest,
  let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1)
  // dilate / close with
  let cirKernal = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(15, 15))
  // ok, to draw contours
  let hierarchy = new cv.Mat()
  let contours = new cv.MatVector()
  let dsp = new cv.Mat(video.height, video.width, cv.CV_8UC4)
  console.log('dsp', dsp)
  let dcolour = new cv.Scalar(255, 0, 0, 255)
  // hmmm
  let ellipse
  let indice = 0

  const fps = 60
  let streaming = false

  let drawCross = (mat, x, y, size) => {
    let halflen = size / 2
    cv.line(mat, {x: x - halflen, y: y}, {x: x + halflen, y: y}, [255,0,0,255], 1, cv.LINE_AA)
    cv.line(mat, {x: x, y:y - halflen}, {x: x, y: y + halflen}, [255,0,0,255], 1, cv.LINE_AA)
    //console.log('xy', x, y)
  }

  let processVideo = () => {
    try {
      if (!streaming) {
        // clean and stop
        src.delete()
        dst.delete()
        return
      }
      let begin = Date.now()
      // start
      cap.read(src)
      // take red channel (might want to gaussian blur first?)
      cv.inRange(src, low, hgh, red)
      cv.imshow('outOne', red)
      // ok, this is thresholded (by color / inRange)
      // and it's pinched & pop'd etc
      cv.morphologyEx(red, dst, cv.MORPH_CLOSE, cirKernal);
      cv.morphologyEx(dst, dst, cv.MORPH_OPEN, cirKernal);
      cv.imshow('outTwo', dst)
      // next we want to find contours
      cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE)
      // make dsp src, will draw over
      dsp = src
      // 3rd arg is indice of contour to draw
      cv.drawContours(dsp, contours, indice, dcolour, 0, cv.LINE_8, hierarchy, 100)
      // must clear this, else just drawing in to place
      // finally - we don't get one every time,
      try {
        ellipse = cv.fitEllipse(contours.get(indice))
        if(ellipse){
          drawCross(dsp, ellipse.center.x, ellipse.center.y, 10)
        }
      } catch (err) {

      }
      cv.imshow('outThree', dsp)
      // schedule,
      let delay = 1000 / fps - (Date.now() - begin)
      setTimeout(processVideo, delay)
    } catch (err) {
      console.error('prv err', err)
    }
  }

  streaming = true
  setTimeout(processVideo, 0)
}

let startCamera = () => {
  return new Promise((resolve, reject) => {
    let video = document.getElementById('videoInput')
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    }).then((stream) => {
      video.srcObject = stream
      video.play()
      resolve()
    }).catch((err) => {
      console.error('camera error', err)
      reject(err)
    })
  })
}

/*
// setup,
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  })
  .then((stream) => {
    video.srcObject = stream
    video.play()
  })
  .catch((err) => {
    console.error('ERR caught at video startup', err)
  })

let width = 320
let height = 240

let context = canvas.getContext('2d')
let src = new cv.Mat(height, width, cv.CV_8UC4)
let dst = new cv.Mat(height, width, cv.CV_8UC1)

const fps = 30
function processVideo(){
  let begin = Date.now()
  context.drawImage(video, 0, 0, width, height)
  src.data.set(context.getImageData(0, 0, width, height).data)
  cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY)
  cv.imshow('canvas')
}
*/

// ok,
