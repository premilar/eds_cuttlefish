// want to wrap one ocv obj, importing async type

const OPENCV_URL = 'libs/opencv.js'

window.cvgo = false
window.cvloading = false
window.cvresolvers = []

function loadOpenCv() {
  return new Promise((resolve, reject) => {
    console.log('CVLOAD: begin', window.cvgo, window.cvloading, window.cvresolvers.length)
    if (window.cvgo && !window.cvloading && cv) {
      console.log('CVLOAD: here already')
      resolve()
    } else if (window.cvloading) {
      console.log('CVLOAD: already loading, adding to resolve')
      window.cvresolvers.push(resolve)
    } else {
      console.log('CVLOAD: loading cv, ok')
      window.cvloading = true
      let script = document.createElement('script')
      script.setAttribute('async', '')
      script.setAttribute('type', 'text/javascript')
      script.addEventListener('load', () => {
        // ocv drops 'cv' in to toplevel documeeeent yikes
        // let's see if we can just stash this local copy,
        // and shell it out ...
        console.log('CVLOAD: loaded')
        window.cvgo = true
        window.cvloading = false
        resolve()
        if(window.cvresolvers.length > 0){
          for(let res of window.cvresolvers){
            res()
          }
        }
      })
      script.addEventListener('error', (err) => {
        console.error('CVLOAD: failed to load script', err)
        reject(err)
      })
      script.src = OPENCV_URL
      let node = document.getElementsByTagName('script')[0]
      node.parentNode.insertBefore(script, node)
    }
  })
}

function getWebcam(w, h) {
  return new Promise((resolve, reject) => {
    let video = document.createElement('video')
    video.width = w
    video.height = h
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    }).then((stream) => {
      video.srcObject = stream
      video.play()
      resolve(video)
    }).catch((err) => {
      console.error('cannot get webcam', err)
      reject(err)
    })
  })
}

export {
  loadOpenCv,
  getWebcam
}
