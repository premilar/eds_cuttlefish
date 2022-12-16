/*
hunks/opencv/contourcenters.js

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

function OCVContourCenters() {
  Hunkify(this)

  // coupla globals,
  let dsp, hierarchy, contours, dcolour, c1, c2, e1, e2
  let x = 320
  let y = 240

  // pardon the no-doc, but it's like rlow, rhigh, glow, ghigh, blow, bhigh
  let numContours = new State('number', 'numContours', 2)
  // could do set-size here also, or should,
  let resetMatricies = (num) => {
    // set canvas,
    $(canvas).width(x).height(y)
    this.requestResize(x, y)

    dsp = new cv.Mat(y, x, cv.CV_8UC4)
    hierarchy = new cv.Mat()
    contours = new cv.MatVector()
    dcolour = new cv.Scalar(255, 0, 0, 255)
    // eh,
  }
  this.states.push(numContours)

  // input,
  let matInput = new Input('reference', '(ocvmat) in', this)
  let layInput = new Input('reference', '(ocvmat) underlay', this)
  this.inputs.push(matInput, layInput)

  let xOne = new Output('number', 'x1', this)
  let yOne = new Output('number', 'y1', this)
  let xTwo = new Output('number', 'x2', this)
  let yTwo = new Output('number', 'y2', this)
  this.outputs.push(xOne, yOne, xTwo, yTwo)

  let allClear = () => {
    if (xOne.io() || yOne.io() || xTwo.io() || yTwo.io()) {
      return false
    } else {
      return true
    }
  }

  this.init = () => {
    //
  }

  this.dom = $('<div>')
  let canvas = $('<canvas>')
  let go = false

  this.onload = () => {
    $(this.dom).append(canvas)
    $(canvas).attr('id', 'centid')
    // important to do this after cv is available,
    loadOpenCv().then(() => {
      resetMatricies(numContours.value)
      go = true
    })
  }

  let drawCross = (mat, x, y, size) => {
    let halflen = size / 2
    cv.line(mat, {x: x - halflen, y: y}, {x: x + halflen, y: y}, [255,0,0,255], 1, cv.LINE_AA)
    cv.line(mat, {x: x, y:y - halflen}, {x: x, y: y + halflen}, [255,0,0,255], 1, cv.LINE_AA)
    //console.log('xy', x, y)
  }

  this.loop = () => {
    if(!go) return
    if (layInput.io()) {
      dsp = layInput.get().clone()
    }
    if (allClear() && matInput.io()) {
      cv.findContours(matInput.get(), contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE)
      cv.drawContours(dsp, contours, 0, dcolour, 0, cv.LINE_8, hierarchy, 100)
      cv.drawContours(dsp, contours, 1, dcolour, 0, cv.LINE_8, hierarchy, 100)
      try {
        // ok, do two,
        let c1, c2
        c1 = contours.get(0)
        c2 = contours.get(1)
        if(c1 && c2){
          e1 = cv.fitEllipse(c1)
          if(e1){
            drawCross(dsp, e1.center.x, e1.center.y, 10)
            if(!xOne.io() && !yOne.io()){
              xOne.put(e1.center.x)
              yOne.put(e1.center.y)
            }
          }
          e2 = cv.fitEllipse(c2)
          if(e2){
            drawCross(dsp, e2.center.x, e2.center.y, 10)
            if(!xTwo.io() && !yTwo.io()){
              xTwo.put(e2.center.x)
              yTwo.put(e2.center.y)
            }
          }
        }

      } catch (err) {
        //
      }
      cv.imshow('centid', dsp)
    }
  }

}

export default OCVContourCenters
