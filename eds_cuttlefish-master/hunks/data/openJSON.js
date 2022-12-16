/*
hunks/data/openJSON.js

opens JSON files from user upload

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


export default function OpenJSON() {
  Hunkify(this)

  let outRef = new Output('reference', 'data', this)
  this.outputs.push(outRef)

  let refUpdated = false
  let theRef = {}
  let bumpState = new State('boolean', 'release', false)
  this.states.push(bumpState)
  bumpState.onChange = (value) => {
    refUpdated = true
  }

  let readJSON = (file) => {
    let reader = new FileReader()
    reader.onload = (evt) => {
      theRef = JSON.parse(evt.target.result)
      // that's it,
      refUpdated = true
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
    if(refUpdated && !outRef.io()){
      outRef.put(theRef)
      refUpdated = false
    }
  }

}
