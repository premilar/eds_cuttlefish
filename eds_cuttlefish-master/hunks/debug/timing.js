/*
hunks/debug/timing.js

gate events, count events while passing thru 

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

import smallstat from '../../libs/smallstat.js'

function Timing() {
  Hunkify(this)

  let inp = new Input('boolean', 'thru', this)
  this.inputs.push(inp)

  let out = new Output('boolean', 'thru', this)
  let meanOut = new Output('number', 'mean (ms)', this)
  let varianceOut = new Output('number', 'variance', this)
  this.outputs.push(out, meanOut, varianceOut)

  let count = new State('number', 'average', 100)
  let log = new State('boolean', 'log', true)
  this.states.push(count, log)

  let t0 = performance.now()
  let t1 = t0
  let step = 0
  let vals = []
  let avcnt = 0

  let mean = 0
  let variance = 0

  console.log('smallstat:', smallstat)

  this.loop = () => {
    if (inp.io() && !(out.io())) {
      // through the gate
      out.put(inp.get())
      // new value
      t1 = performance.now()
      // work
      step = t1 - t0
      vals.push(step)
      t0 = t1
      avcnt++
      if (avcnt > count.value) {
        mean = smallstat.mean(vals)
        variance = smallstat.variance(vals)
        if (log.value) {
          console.log("timer: mean", mean, "variance", variance)
        }
        if (!meanOut.io()) {
          meanOut.put(mean)
        }
        if (!varianceOut.io()) {
          varianceOut.put(variance)
        }
        avcnt = 0
        vals.length = 0
      }
    }
  }
}



export default Timing
