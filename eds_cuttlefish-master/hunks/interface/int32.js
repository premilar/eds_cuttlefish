/*
hunks/interface/int32.js

used in early debugging for shipping types to embedded contexts 

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

export default function Int32() {
    Hunkify(this)

    let numout = new Output('int32', 'outp', this)
    this.outputs.push(numout)

    let numrep = new State('int32', 'numrep', 12)
    this.states.push(numrep)

    // as is tradition,
    this.dom = {}

    this.init = () => {
        // manager calls this once
        // it is loaded and state is updated (from program)
        console.log('HELLO NUMINPUT')
        this.dom = $('<div>').get(0)
        //this.dom = document.createElement('div')
    }

    this.onload = () => {
      let contact = $('<div>').addClass('btn').append('! contact !').get(0)
      $(this.dom).append(contact)
      contact.addEventListener('click', (evt) => {
          numout.put(numrep.value)
      })
    }

    this.loop = () => {
      //
    }
}
