/*
hunks/math/increment.js

increments some value by input values,

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

function Increment() {
  Hunkify(this)

  let inp = new Input('number', 'increment', this)
  this.inputs.push(inp)

  let out = new Output('number', 'value', this)
  this.outputs.push(out)

  // the val,
  let value = 0
  let update = false

  let reset = new State('boolean', 'reset', false)
  this.states.push(reset)
  reset.onChange = (value) => {
    value = 0
  }

  // don't need to init, thx

  this.loop = () => {
    if(inp.io()){
      value += inp.get()
      update = true
    }
    if(!(out.io()) && update){
      out.put(value)
      update = false
    }
  }
}

export default Increment
