/*
hunks/math/booleaninversion.js

bit flipper 

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

function BooleanInversion() {
  Hunkify(this)

  let inp = new Input('boolean', 'state', this)
  this.inputs.push(inp)

  let out = new Output('boolean', 'inverted', this)
  this.outputs.push(out)

  this.loop = () => {
    if(inp.io() && !(out.io())){
      out.put(!(inp.get()))
    }
  }

}

export default BooleanInversion
