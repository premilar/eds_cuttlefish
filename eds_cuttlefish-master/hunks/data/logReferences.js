/*
hunks/data/logReferences.js

logs (almost) anything 

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/
/*

debugger ! log anything !

*/

import { Hunkify, Input, Output, State } from '../hunks.js'

export default function ReferenceLogger() {
  Hunkify(this)

  // hmm...
  let tolog = new Input('reference', 'tolog', this)
  this.inputs.push(tolog)

  let prefix = new State('string', 'prefix', 'LOG:')
  let logToConsole = new State('boolean', 'console', true)
  this.states.push(prefix, logToConsole)

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
      let raw = tolog.get()
      let stringRep
      if (Array.isArray(raw)) {
        stringRep = raw.join(', ')
      } else if (typeof raw === "boolean") {
        stringRep = raw.toString()
      } else {
        // let js do w/e witchcraft it chooses
        stringRep = raw
      }
      $(this.dom).children('.txt').html(stringRep)
      if (logToConsole.value === true) {
        console.log(this.ind, prefix.value, raw)
      }
    }
  }
}
