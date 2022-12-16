/*
hunks/flowcontrol/syncPressure.js

synchronous pressure to outputs

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
  let runState = new State('boolean', 'run', false)
  this.states.push(runState)
  // and setup:
  let status = new State('string', 'types', '')
  let pTypes = new State('string', 'types', 'boolean, number')
  let pVals = new State('string', 'values', 'true, 12')
  this.states.push(status, pTypes, pVals)

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
      if (candOutputs.length != pv.length){
        status.set('missing some outputs...')
        return
      }
      for (let v in pv) {
        // let's use the string copy f'ns for this
        let strphy = findPhy('string')
        // a method to write values from strings exists?
        if(strphy.copy[pt[v]]){
          candValues.push(strphy.copy[pt[v]](pv[v]))
        } else {
          console.log(`no string-to-${pt[v]} exists`)
        }
      }
      if(candValues.length != pv.length){
        status.set('missing some values...')
      }
      status.set('type, value sets OK')
      this.outputs = candOutputs
      values = candValues
      // if we call this during init the system becomes confused
      if(!init) this.mgr.evaluateHunk(this)
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

  this.init = () => {
    setup(true)
  }

  this.loop = () => {
    if (runState.value) {
      let clear = 0
      for (let op of this.outputs) {
        if (!op.io()) clear++
      }
      if (clear && clear >= this.outputs.length) {
        // contact!
        for (let o in this.outputs) {
          this.outputs[o].put(values[o])
        }
      }
    }
  }
}
