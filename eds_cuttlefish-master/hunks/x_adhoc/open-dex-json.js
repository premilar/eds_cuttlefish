/*
hunks/x_adhoc/vectorize.js

bridge to the future 

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


export default function OpenJSON() {
  Hunkify(this)

  let outref = new Output('reference', 'data', this)
  this.outputs.push(outref)

  let readJSON = (file) => {
    let reader = new FileReader()
    reader.onload = (evt) => {
      let parsed = JSON.parse(evt.target.result)
      // put zeroes together
      let zc = parsed.findIndex((elem) => {
        return elem[1] > 0
      })
      console.log(zc)
      parsed = parsed.slice(zc)
      console.log('json', parsed)
      for(let pt of parsed){
        pt[0] = pt[0]*0.001
        pt[1] = pt[1]*0.0098
      }
      outref.put(parsed)
      // outref.put(adjusted)
    }
    reader.readAsText(file)
  }

  this.init = () => {
    this.dom = $('<div>').get(0)
  }

  this.onload = () => {
    let btn = $('<input type="file" accept=".json">').get(0)
    $(btn).on('change', (evt) => {
      readJSON(evt.target.files[0])
    })
    $(this.dom).append(btn)
  }

  this.loop = () => {
  }

}
