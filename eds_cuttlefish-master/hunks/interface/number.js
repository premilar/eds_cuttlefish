/*
hunks/interface/number.js

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

function Number() {
    Hunkify(this)

    let numout = new Output('number', 'num', this)
    this.outputs.push(numout)

    let numrep = new State('number', 'numrep', 275074)
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

export default Number
