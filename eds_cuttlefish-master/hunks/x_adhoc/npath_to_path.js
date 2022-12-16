/*
hunks/x_adhoc/npath_to_path.js

write z-moves for 3D array from MD array of 2D segs 

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

export default function NPZ2PZ(){
  Hunkify(this)

  let outPath = this.output('reference', 'path')
  let inPath = this.input('reference', 'path')
  let zUp = this.state('number', 'clearance', 10)
  let zDown = this.state('number', 'depth', -5)

  let unfp = []
  let unfpUpdated = false

  let unfPath = (fp) => {
    // RIP oldboy
    unfp.length = 0
    // new friend
    let zu = zUp.value
    let zd = zDown.value
    // flatten, adding z-moves
    for(let leg of fp){
      // start each leg up top, above the first point,
      unfp.push([leg[0][0], leg[0][1], zu])
      for(let point of leg){
        unfp.push([point[0], point[1], zd])
      }
      // and the lift, to tail
      let last = leg[leg.length - 1]
      unfp.push([last[0], last[1], zu])
    }
    // we doooone
    unfpUpdated = true
  }

  this.loop = () => {
    if(inPath.io()){
      unfPath(inPath.get())
    }
    if(unfpUpdated && !outPath.io()){
      outPath.put(unfp)
      unfpUpdated = false
    }
  }
}
