/*
hunks/interface/button.js

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import { Hunkify, Input, Output, State } from '../hunks.js'

export default function Button() {
    Hunkify(this)

    let onclk = this.output('boolean', 'onclick')
    /* aspirationally
    this.outputs.mousedown
    this.outputs.mouseup
    */
    /*
    let strang = new State('string', 'strng', 'start value')
    let numbr = new State('number', 'nmbr', 101)
    let blen = new State('boolean', 'bln', false)
    this.states.push(strang, numbr, blen)
    */

    this.dom = {}

    this.init = () => {
        // manager calls this once
        this.log('HELLO BUTTON')
        this.dom = $('<div>').get(0)
    }

    this.onload = (dom) => {
      // function equivalent, our .dom element is loaded into ~ the d o m ~
      let contact = $('<div>').addClass('btn').append('! contact !').get(0)
      $(this.dom).append(contact)
      contact.addEventListener('click', (evt) => {
          //console.log('button hunk down')
          if(onclk.io()){
            console.warn("button attempts to push to occupied output")
          } else {
            onclk.put(true)
          }
      })
    }

    this.loop = () => {
        // ...
    }
}
