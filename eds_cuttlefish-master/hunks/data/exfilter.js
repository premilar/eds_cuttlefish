/*
hunks/data/exFilter.js

removes old lovers from data streams

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import { Hunkify, Input, Output, State } from '../hunks.js'

export default function Smooth(){
  Hunkify(this)

  let inNum = this.input('number', 'vals')
  let outNum = this.output('number', 'smoother')
  let reset = this.state('boolean', 'reset', false)
  let weight = this.state('number', 'weight, 0-1', 0.9)

  let yl = 0

  reset.onChange = (value) => {
    yl = 0
  }

  weight.onChange = (value) => {
    weight.set(Math.max(Math.min(value, 1), 0))
  }

  this.loop = () => {
    if(inNum.io() && !outNum.io()){
      yl = weight.value * inNum.get() + (1 - weight.value) * yl
      outNum.put(yl)
    }
  }
}
