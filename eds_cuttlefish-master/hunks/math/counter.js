/*
hunks/math/counter.js

on input, internal value += 1 or -= 1

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

function Counter() {
  Hunkify(this)

  let evtInc = new Input('number', 'increment', this)
  let evtDec = new Input('number', 'decrement', this)
  let resetInp = new Input('boolean', 'reset', this)
  this.inputs.push(evtInc, evtDec, resetInp)

  let out = new Output('number', 'count', this)
  this.outputs.push(out)

  // the val,
  let count = 0
  let update = false

  // the hack is that boolean states are often just used as buttons ...
  let resetState = new State('boolean', 'reset', false)
  this.states.push(resetState)
  resetState.onchange = (value) => {
    count = 0
    update = true
  }

  // don't need to init, thx

  this.loop = () => {
    if(resetInp.io()){
      count = 0
      update = true
    }
    if(evtInc.io()){
      evtInc.get()
      count ++
      update = true
    }
    if(evtDec.io()){
      evtDec.get()
      count --
      update = true
    }
    if(!(out.io()) && update){
      out.put(count)
      update = false
    }
  }
}

export default Counter
