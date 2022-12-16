/*
hunks/flowcontrol/syncAwait.js

release outputs on sync at inputs

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
  TSET,
  findPhy
} from '../../typeset.js'

// synchronous pressure .. polymorphic

export default function Pressure() {
  Hunkify(this)

  // the hack is that boolean states are often just used as buttons ...
  let startup = false
  let runState = new State('boolean', 'run', false)
  runState.onChange = (value) => {
    // always a toggle, then
    if(runState.value){
      runState.set(false)
      startup = false
    } else {
      runState.set(true)
      startup = true
    }
  }
  this.states.push(runState)
  // and setup:
  let status = new State('string', 'status', '')
  let aType = new State('string', 'await', 'boolean')
  let pTypes = new State('string', 'types', 'boolean, number')
  let pVals = new State('string', 'values', 'true, 4')
  this.states.push(status, aType, pTypes, pVals)

  let values = []
  let setup = (init) => {
    let pt = pTypes.value.split(',')
    let pv = pVals.value.split(',')
    // tough, we want to check that all types exist, and can convert from some string to whatever else we put in here...
    if (pt.length == pv.length) {
      let count = 0
      let candOutputs = []
      let candValues = []
      for (let t in pt) {
        // take leading spaces out,
        if (pt[t].indexOf(' ') > -1) pt[t] = pt[t].substring(pt[t].indexOf(' ') + 1)
        if (findPhy(pt[t])) {
          candOutputs.push(new Output(pt[t], pt[t], this))
        }
      }
      if (candOutputs.length != pv.length) {
        status.set('missing some outputs...')
        return
      }
      for (let v in pv) {
        // let's use the string copy f'ns for this
        let strphy = findPhy('string')
        // a method to write values from strings exists?
        if (strphy.copy[pt[v]]) {
          candValues.push(strphy.copy[pt[v]](pv[v]))
        } else {
          console.log(`no string-to-${pt[v]} exists`)
        }
      }
      if (candValues.length != pv.length) {
        status.set('missing some values...')
      }
      status.set('type, value sets OK')
      this.outputs = candOutputs
      values = candValues
      // if we call this during init the system becomes confused
      if (!init) this.mgr.evaluateHunk(this)
    } else {
      status.set('mistmatched lists...')
      // mismatched lists, probably ...
      // here's a case where it would be great to repl- with an error...
    }
  }

  pTypes.onChange = (value) => {
    pTypes.set(value)
    setup()
  }

  pVals.onChange = (value) => {
    pVals.set(value)
    setup()
  }

  let setupAwait = (init) => {
    if (findPhy(aType.value)) {
      this.inputs[0] = new Input(aType.value, 'await', this)
      if (!init) this.mgr.evaluateHunk(this)
    } else {
      status.set('bad await type')
    }
  }

  aType.onChange = (value) => {
    aType.set(value)
    setupAwait()
  }

  this.init = () => {
    runState.set(false)
    setup(true)
    setupAwait(true)
  }

  this.loop = () => {
    let clear = 0
    for (let op of this.outputs) {
      if (!op.io()) clear++
    }
    // have special rules for this,
    if (startup) {
      if (clear) {
        // contact!
        for (let o in this.outputs) {
          this.outputs[o].put(values[o])
        }
        startup = false
      }
    } else if (runState.value) {
      if (clear && clear >= this.outputs.length && this.inputs[0].io()) {
        // contact!
        this.inputs[0].get()
        for (let o in this.outputs) {
          this.outputs[o].put(values[o])
        }
      }
    } else { // not running, clear all gates regardless ...
      if(this.inputs[0].io()){
        this.inputs[0].get()
      }
    }
  }
}
