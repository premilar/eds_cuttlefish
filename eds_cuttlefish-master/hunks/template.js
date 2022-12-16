/*
hunks/template.js

example of ahn hunk

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/


// these are ES6 modules
import {
  Hunkify,
  Input,
  Output,
  State
} from './hunks.js'

// our function name actually doesn't matter: hunks in js are named by their
// location on disk
export default function Name() {
  // this fn attaches handles to our function-object,
  Hunkify(this)

  // inputs, outputs, and state are objects.
  // they each have a type and a name
  let inA = this.input('string', 'quiet')
  let outB = this.output('string', 'loud')

  // states take another argument: their default startup value
  let stateItem = this.state('string', 'exclaim', '!')

  // State items also have change handlers,
  stateItem.onChange = (value) => {
    // at this point, a request to update this state item to the provided value
    // has been made
    console.log('requests:', value)
    // we can reject that, by doing nothing here, or we can
    stateItem.set(value)
    // or compute on it, set limits, etc
  }

  // hunks can choose to- or not- have init code.
  // at init, the module has been loaded into the JS engine and state variables have been
  // recalled from any program save - so this is a good point
  // to check any of those, and setup accordingly ...
  this.init = () => {
    this.log('hello template world')
  }

  // there are no rules within this closure, local functions, data, etc...
  let internalVariable = 'local globals'
  function internalFunc(str) {
    let caps = str.toUpperCase()
    caps += stateItem.value
    return (caps)
  }

  // to divide time between hunks, each has a loop function
  // this is the hunks' runtime, and is called repeatedly, as the process runs
  // here is where we check inputs, put to outputs, do work, etc
  this.loop = () => {
    // typically we check inputs and outputs first,
    // making sure we are clear to run,
    if (inA.io() && !outB.io()) {
      // an input is occupied, and the exit path is empty

      // loop that iterates thru input list of move, pour tuples
      // outputs move 
      // outputs pour
      let output = internalFunc(inA.get())
      // put 'er there
      outB.put(output)
    }
  }
}
