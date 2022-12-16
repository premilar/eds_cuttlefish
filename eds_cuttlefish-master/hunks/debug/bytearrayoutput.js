/*
hunks/debug/byteArrayOutput.js

mostly, to unit test routers

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import { Hunkify, Input, Output, State } from '../hunks.js'

function ByteArrayOutput() {
    Hunkify(this, 'ByteArrayOutput')

    let otp = new Output('byteArray', 'source', this)
    this.outputs.push(otp)

    let pbutton = new State('boolean', 'gobutton', false)
    let bytesAsAString = new State('string', 'prefix', '85, 86, 87, 88')
    this.states.push(pbutton, bytesAsAString)

    pbutton.onChange = (value) => {
      if(otp.io()){
        console.warn("byte output machine's byte output port is occupied, cannot push more")
      } else {
        let arr = bytesAsAString.value.split(',')
        let narr = []
        for(let item of arr){
          narr.push(parseInt(item))
        }
        otp.put(narr)
      }
    }

    this.init = () => {
        this.log('HELLO ByteArrayOutput')
    }

    this.loop = () => {
        // happens at the button
    }
}

export default ByteArrayOutput
