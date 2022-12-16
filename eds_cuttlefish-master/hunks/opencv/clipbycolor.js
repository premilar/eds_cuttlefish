/*
hunks/opencv/clipbycolor.js

Jake Read at the Center for Bits and Atoms
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

import {
  loadOpenCv,
  getWebcam
} from '../../libs/opencvwrap.js'

function OCVClipByColor() {
  Hunkify(this)

  // coupla globals,
  let low, high, clipped, kernel
  let x = 320
  let y = 240

  // pardon the no-doc, but it's like rlow, rhigh, glow, ghigh, blow, bhigh
  let boundState = new State('string', 'inRange', '50, 255, 0, 50, 0, 50')
  // could do set-size here also, or should,
  let resetMatricies = (str, setState) => {
    // set canvas,
    $(canvas).width(x).height(y)
    this.requestResize(x, y)
    let vals = boundState.value.split(',')
    let varr = []
    for(let val in vals){
      varr[val] = parseInt(vals[val])
      console.log('val, varr', val, varr[val])
    }
    // ok,
    low = new cv.Mat(y, x, cv.CV_8UC4, [varr[0], varr[2], varr[4], 0])
    high = new cv.Mat(y, x, cv.CV_8UC4, [varr[1], varr[3], varr[5], 255])
    // also,
    clipped = new cv.Mat(y, x, cv.CV_8UC1)
    // and ah kernel
    kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(15, 15))
    // ok,
    if (setState) boundState.set(str)
  }
  boundState.onChange = (value) => {
    try {
      resetMatricies(value, true)
    } catch (err) {
      this.log(err)
    }
  }
  this.states.push(boundState)

  // input,
  let matInput = new Input('reference', '(ocvmat) in', this)
  this.inputs.push(matInput)

  let matOutput = new Output('reference', '(ocvmat) out', this)
  this.outputs.push(matOutput)

  this.init = () => {
    //
  }

  this.dom = $('<div>')
  let canvas = $('<canvas>')
  let go = false

  this.onload = () => {
    $(this.dom).append(canvas)
    $(canvas).attr('id', 'threshid')
    // important to do this after cv is available,
    loadOpenCv().then(() => {
      resetMatricies(boundState.value)
      go = true
    })
  }

  this.loop = () => {
    if (!matOutput.io() && matInput.io() && go) {
      cv.inRange(matInput.get(), low, high, clipped)
      // also the kernelz
      cv.morphologyEx(clipped, clipped, cv.MORPH_CLOSE, kernel)
      cv.morphologyEx(clipped, clipped, cv.MORPH_OPEN, kernel)
      // and then we
      cv.imshow('threshid', clipped)
      // and,
      matOutput.put(clipped)
    }
  }

}

export default OCVClipByColor
