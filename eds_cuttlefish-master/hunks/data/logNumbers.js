/*
hunks/data/logNumbers.js

numbers are not references to numbers and so this is a necessary non-violation

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import { Hunkify, Input, Output, State } from '../hunks.js'

export default function NumberLogger() {
  Hunkify(this)

  // hmm...
  let tolog = new Input('number', 'tolog', this)
  this.inputs.push(tolog)

  let logToConsole = new State('boolean', 'console', false)
  this.states.push(logToConsole)

  this.dom = {}

  this.init = () => {
    this.dom = $('<div>').get(0)
  }

  this.onload = () => {
    //error here
    let text = $('<div>').addClass('txt').append('- >').get(0)
    $(this.dom).append(text)
  }

  this.loop = () => {
    // this will be called once every round turn
    // typically we check flow control first
    if (tolog.io()) {
      // an input is occupied, and the exit path is empty
      let val = tolog.get()
      $(this.dom).children('.txt').html(val)
      if (logToConsole.value === true) {
        console.log(`logger ${this.ind}`, val)
      }
    }
  }
}
