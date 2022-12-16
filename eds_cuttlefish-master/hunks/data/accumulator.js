/*
hunks/data/accumulator.js

stashes data stream to an array

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

function Accumulator(){
  Hunkify(this)

  // todo: make this polymorphic
  let ipr = new Input("boolean", "reset", this)
  let ivx = new Input("number", "x", this)
  let ivy = new Input("number", "y", this)
  this.inputs.push(ipr, ivx, ivy)
  // push a reference out, for now
  let outref = new Output("reference", "accumulated", this)
  this.outputs.push(outref)
  // reset button
  // todo:
  // let rstrig = this.states.add("boolean", "reset", false)
  let rstrig = new State("boolean", "reset", false)
  this.states.push(rstrig)

  let reset = () => {
    arr = []
    if(!outref.io()){
      outref.put(arr)
    }
  }

  rstrig.onChange = (value) => {
    reset()
  }

  this.init = () => {
    //
  }

  let arr = []

  this.loop = () => {
    if(ipr.io()){
      ipr.get()
      reset()
    }
    if(ivx.io() && ivy.io()){
      arr.push([ivx.get(), ivy.get()])
      // todo: for ref, pass always OK ? breaks rules anyways ...
      if(!outref.io()){
        outref.put(arr)
      }
    }
  }
}

export default Accumulator
