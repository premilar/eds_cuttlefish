/*
hunks/opencv/ocvwebcam.js

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// these are ES6 modules
import {
  Hunkify,
  Input,
  Output,
  State
} from '../hunks.js'

import {
  loadOpenCv,
  getWebcam
} from '../../libs/opencvwrap.js'

function OCVWebcam() {
  // this fn attaches handles to our function-object,
  Hunkify(this)

  let matOutput = new Output('reference', '(ocvmat) capture', this)
  this.outputs.push(matOutput)

  // dom stuuuuf
  this.dom = $('<div>')
  let canvas = $('<canvas>')
  console.log('canvas')

  // cam / and dst to read into / draw out of / ship
  let cam
  let dst
  // keep trak
  let x, y

  let stateDims = new State('string', 'dimensions', '320, 240')
  let dimSet = (str, noUpdate) => {
    // no probs, just go
    let vals = str.split(',')
    try {
      x = parseInt(vals[0])
      y = parseInt(vals[1])
      this.requestResize(x, y)
      if (!noUpdate) stateDims.set(value)
    } catch (err) {
      // donot set, say:
      this.log(`could not change size, ${err}`)
    }
  }
  stateDims.onChange = (value) => {
    dimSet(value)
  }
  this.states.push(stateDims)

  let delayState = new State('number', 'delay', 100)
  delayState.onChange = (value) => {
    // 24 fps ~ 41.6ms, so:
    delayState.set(Math.max(40, value))
  }
  this.states.push(delayState)

  /*
  let playOnce = new State('boolean', 'snapshot', false)
  let playStream = new State('boolean', 'stream', true)
  this.states.push(playOnce, playStream)

  // State items also have change handlers,
  playOnce.onChange = (value) => {
    // do one shot and bail
  }

  playStream.onChange = (value) => {
    // toggle go / no go state
  }
  */

  this.onload = () => {
    // ok,
    $(this.dom).append(canvas)
    $(canvas).attr('id', 'cid')
    // this also sets x and y,
    dimSet(stateDims.value, true)
    loadOpenCv().then((lib) => {
      return getWebcam(x, y)
    }).then((videoElement) => {
      //$(this.dom).append(videoElement)
      cam = new cv.VideoCapture(videoElement)
      dst = new cv.Mat(y, x, cv.CV_8UC4)
      go = true
    })
  }

  this.init = () => {
    // really, we are more interested in onload
  }

  let timeout = true
  let go = false

  this.loop = () => {
    if (cam && cv && !matOutput.io() && timeout && go) {
      // read the cam
      cam.read(dst)
      // show the slice
      cv.imshow('cid', dst)
      // push 2 output
      // for mem, dst is not copied, is passed by reference
      matOutput.put(dst)
      // still running in-loop, but throttling to a max time between frames
      // this is slow for us, friendly to others. to max, just do
      // this all the time, but you might thrash the hardware drivers (for the cam)
      timeout = false
      setTimeout(() => {
        timeout = true
      }, delayState.value)
    } else {
      // noop, probably waiting for either...
    }
  }
}

// the hunk is also an ES6 module, this is how we export those:
export default OCVWebcam
