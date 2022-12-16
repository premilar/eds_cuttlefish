/*
hunks/flowcontrol/consumer.js

timed consumption of some outupt

Jake Read at the Center for Bits and Atoms with Neil Gershenfeld and Leo McElroy
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

export default function Consumer(){
  Hunkify(this)

  let takeup = this.input('number', 'takes')
  let taken = false
  let period = this.state('number', 'period', 50)

  this.loop = () => {
    if(takeup.io() && !taken){
      takeup.get()
      taken = true
      setTimeout(() => {
        taken = false
      }, period.value)
    }
  }
}
