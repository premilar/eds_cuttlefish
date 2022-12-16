/*
hunks/math/LeastSquaresFit.js

input previous system measurements as state (lists)
make predictions for y based on input at x, with lsq. from old data
to expand: accept arrays as inputs, from automatic measurements ?

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

import smallmath from '../../libs/smallmath.js'

export default function LeastSquares() {
  Hunkify(this)

  let loadCellInput = new Input('number', 'reading', this)
  this.inputs.push(loadCellInput)

  let loadReading = new Output('number', 'prediction', this)
  this.outputs.push(loadReading)

  let isOkToCalc = false
  // admit unwillingness to write nice array wrappers,
  // do that locally ..
  let xStateArray = new State('string', 'csv: readings: x', '25, 14854, 29649, 44453, 74061, 103695')
  let yStateArray = new State('string', 'csv: readings: y', '0, -0.100, -0.200, -0.300, -0.500, -0.700')
  // state!
  let m, b = 0
  let writeCalExpression = () => {
    let exes = xStateArray.value.split(',')
    let whys = yStateArray.value.split(',')
    // haha, sorry
    for (let x in exes) {
      exes[x] = parseInt(exes[x])
    }
    for (let y in whys) {
      whys[y] = parseFloat(whys[y])
    }
    if (exes.length === whys.length && exes.length > 2) {
      // we gucc 2 lsq
      let lsqr = smallmath.lsq(exes, whys)
      m = lsqr.m
      b = lsqr.b
      isOkToCalc = true
      console.log(`m, ${m}, b, ${b}`)
      // we round 'em out a bit ... local values are full width;
      if (b >= 0) {
        return `${m.toExponential(2)} x + ${b.toExponential(2)}`
      } else {
        return `${m.toExponential(2)} x ${b.toExponential(2)}`
      }
    } else {
      isOkToCalc = false
      return 'bad inputs ...'
    }
  }
  let result = new State('string', 'calibration result', writeCalExpression())
  this.states.push(xStateArray, yStateArray, result)
  xStateArray.onChange = (value) => {
    xStateArray.set(value)
    result.set(writeCalExpression())
  }
  yStateArray.onChange = (value) => {
    yStateArray.set(value)
    result.set(writeCalExpression())
  }

  this.init = () => {
    result.set(writeCalExpression())
  }

  this.loop = () => {
    if (loadCellInput.io()) {
      if (isOkToCalc) {
        if (!loadReading.io()) {
          loadReading.put(m * loadCellInput.get() + b)
        }
      } else {
        // not ok to calc, clear flow control anyways,
        loadCellInput.get()
      }
    }
  }
}
