/*
hunks/adhoc/tpath.js

canned paths, for testing motion control systems 

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

// example-path-long.js also exists...
// example-path-small.js ...
// example-path-sl2.js
import * as longpath from '../../test_files/example-path-long.js'
import * as smallpath from '../../test_files/example-path-small.js'
import * as sl2path from '../../test_files/example-path-sl2.js'
import { vScalar } from '../../libs/smallvectors.js'

let scalePath = (path, scale) => {
  for(let i = 0; i < path.length; i ++){
    path[i] = vScalar(path[i], scale)
  }
}

export default function TPFCOUT(){
  Hunkify(this)

  let path = []
  let go = false

  let outPosn = this.output('array', 'position')

  let scalar = this.state('number', 'scalar', 1)
  let logArrLen = this.state('boolean', 'log progress', false)

  let longSet = this.state('boolean', 'longpath', false)
  longSet.onChange = (value) => {
    go = true
    path = JSON.parse(JSON.stringify(longpath.default.arr))
    scalePath(path, (1/1269)*25.4)
  }
  let shortSet = this.state('boolean', 'shortpath', false)
  shortSet.onChange = (value) => {
    go = true
    path = JSON.parse(JSON.stringify(smallpath.default.arr))
    scalePath(path, (1/1269)*25.4)
  }
  let sl2pathSet = this.state('boolean', 'sl2path', false)
  sl2pathSet.onChange = (value) => {
    go = true
    path = JSON.parse(JSON.stringify(sl2path.default.arr))
    scalePath(path, (1/72)*25.4)
  }

  // copies out, one at a time, fc pressure
  this.loop = () => {
    if(path.length > 0 && go){
      if(!outPosn.io()){
        let op = vScalar(path.shift(), scalar.value)
        if(logArrLen.value) console.log('tpath len: ', path.length)
        outPosn.put(op)
      }
    }
  }
}
