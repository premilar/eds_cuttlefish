/*
hunks/image/webcam.js

pull image from webcam 

Jake Read at the Center for Bits and Atoms with Neil Gershenfeld and Leo McElroy
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import {
  Hunkify,
  Input,
  Output,
  State
} from '../hunks.js'

export default function RTCWebcam(){
  Hunkify(this)

  let imgOut = this.output('ImageData', 'frame')

  this.dom = $('<div>').get(0)
  let video = $('<video>').get(0)
  let streaming = false
  let canvas = $('<canvas>').get(0) // invisible canvas 4 us
  let context
  this.onload = () => {
    navigator.mediaDevices.getUserMedia({video: true, audio: false}).then((stream) => {
      $(this.dom).append(video)
      video.srcObject = stream
      video.play()
      video.addEventListener('canplay', (evt) => {
        if(!streaming){
          streaming = true
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          context = canvas.getContext('2d')
        }
        /*
        let capture = () => {
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          let imgData = context.getImageData(0, 0, canvas.width, canvas.height)
          console.log(imgData)
          setTimeout(capture, 2000)
        }
        setTimeout(capture, 2000)
        */
      })
    }).catch((err) => {
      console.log('get user stream error', err)
    })
  }

  this.loop = () => {
    if(streaming && !imgOut.io()){
      // capture frames as imagedata,
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      imgOut.put(context.getImageData(0,0, canvas.width, canvas.height))
    }
  }

}
