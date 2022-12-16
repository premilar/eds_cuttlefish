/*
hunks/math/absolutevalue.js

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

function AbsoluteValueOf(){
  Hunkify(this)

  let inp = this.input('number', 'og')
  let out = this.output('number', 'abs')

  this.loop = () => {
    if(inp.io() && !(out.io())){
      out.put(Math.abs(inp.get()))
    }
  }
}

export default AbsoluteValueOf
