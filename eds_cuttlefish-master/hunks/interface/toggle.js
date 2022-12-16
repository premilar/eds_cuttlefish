/*
hunks/interface/toggle.js

tow-gel

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import { Hunkify, Input, Output, State } from '../hunks.js'

export default function Toggle() {
    Hunkify(this)

    let onclk = this.output('boolean', 'out')
    let nextOut = this.state('boolean', 'next out', true)

    this.dom = {}

    this.init = () => {
        // manager calls this once
        this.dom = $('<div>').get(0)
    }

    this.onload = (dom) => {
      // function equivalent, our .dom element is loaded into ~ the d o m ~
      let contact = $('<div>').addClass('btn').append('! toggle !').get(0)
      $(this.dom).append(contact)
      contact.addEventListener('click', (evt) => {
          if(onclk.io()){
            console.warn("button attempts to push to occupied output")
          } else {
            if(nextOut.value){
              onclk.put(true)
              nextOut.set(false)
            } else {
              onclk.put(false)
              nextOut.set(true)
            }
          }
      })
    }

    this.loop = () => {
        // ... nah
    }
}
