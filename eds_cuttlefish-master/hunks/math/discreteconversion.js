/*
hunks/math/discreteconversion.js

convert to floats, respect discretion

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

export default function DiscreteConverter(){
  Hunkify(this)

  let floatsPerInteger = new State('number', 'units per increment', 4.23387)
  this.states.push(floatsPerInteger)

  let intInput = new Input('number', 'integer', this)
  this.inputs.push(intInput)

  let floatOutput = new Output('number', 'value', this)
  this.outputs.push(floatOutput)

  this.init = () => {
    //
  }

  this.loop = () => {
    // consider: a shorthand for these very-simple-hunks ? inline expressions ?
    if(intInput.io() && !floatOutput.io()){
      floatOutput.put(floatsPerInteger.value * Math.round(intInput.get()))
    }
  }
}
