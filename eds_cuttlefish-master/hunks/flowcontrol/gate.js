/*
hunks/flowcontrol/gate.js

thou shall ? pass : not

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

function Gate(){
  Hunkify(this)

  // also wants to be polymorphic
  let evtIn = new Input('boolean', 'thru', this)
  let runStateIn = new Input('boolean', 'gate', this)
  this.inputs.push(evtIn, runStateIn)

  let evtOut = new Output('boolean', 'thru', this)
  this.outputs.push(evtOut)

  let runState = new State('boolean', 'run', false)
  this.states.push(runState)

  this.init = () => {
    console.log('hello gate')
  }

  this.loop = () => {
    if(runStateIn.io()){
      runState.set(runStateIn.get())
    }
    if(evtIn.io()){
      if(runState.value && !evtOut.io()){
        evtOut.put(evtIn.get())
      }
    }
  }
}

export default Gate
