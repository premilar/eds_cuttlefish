/*
hunks/interface/string.js

user line input

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import { Hunkify, Input, Output, State } from '../hunks.js'

function Strang() {
    Hunkify(this)

    let stringOutput = new Output('string', 'string', this)
    this.outputs.push(stringOutput)

    // this.states.prefix = new State('string', 'prefix', 'LOG:')
    // this.states.onchange = new State('boolean', 'onchange', true)

    this.dom = {}

    this.init = () => {
        // manager calls this once
        // it is loaded and state is updated (from program)
        this.log('hello String')
        this.dom = $('<div>').get(0)
    }

    this.onload = () => {
      let strContainer = $('<div>').addClass('cfcont').appendTo($(this.dom))
      let strinput = $('<input/>').attr({type: 'text', id: 'txtin'}).appendTo($(strContainer)).get(0)
      $(strinput).css('padding', '10px').css('width', '377px').css('border', 'none')
      strinput.value = 'type input here'
      let contact = $('<div>').addClass('btn').append('! push !').get(0)
      $(this.dom).append(contact)
      contact.addEventListener('click', (evt) => {
          console.log('str click')
          stringOutput.put(strinput.value)
      })
    }

    this.loop = () => {

    }
}

export default Strang
