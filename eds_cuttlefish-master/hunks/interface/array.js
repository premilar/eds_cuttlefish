/*
hunks/interface/array.js

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

export default function Number() {
    Hunkify(this)

    let ip = this.input('string', 'arr')
    let op = this.output('array', 'arr')
    let opv = this.state('string', 'csv', '0, 0, 0')

    // as is tradition,
    this.dom = {}

    this.init = () => {
        // manager calls this once
        // it is loaded and state is updated (from program)
        this.dom = $('<div>').get(0)
        //this.dom = document.createElement('div')
    }

    let convert = (str) => {
      let arr = opv.value.split(',')
      for(let i = 0; i < arr.length; i ++){
        arr[i] = parseFloat(arr[i])
      }
      return arr
    }

    this.onload = () => {
      let contact = $('<div>').addClass('btn').append('! shipment !').get(0)
      $(this.dom).append(contact)
      contact.addEventListener('click', (evt) => {
        let arr = convert(opv.value)
        if(!op.io()){
          op.put(arr)
        } else {
          console.warn('this output is blocked')
        }
      })
    }

    this.loop = () => {
      if(ip.io() && !op.io()){
        let str = ip.get()
        opv.set(str)
        let arr = convert(str)
        op.put(arr)
      }
    }
}
