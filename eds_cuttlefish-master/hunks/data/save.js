/*
hunks/data/save.js

write what-ever to JSON, ship 2 download 

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

export default function Save(){
  Hunkify(this)

  let inobj = new Input("reference", "object", this)
  let intrig = new Input("boolean", "trigger", this)
  this.inputs.push(inobj, intrig)
  let savename = new State("string", "name", "datas")
  let svbutton = new State("boolean", "save", false)
  this.states.push(savename, svbutton)

  this.init = () => {
    //
  }

  let ourRef = {
    test: "item"
  }

  let dishit = () => {
    // serialize the thing
    let url = URL.createObjectURL(new Blob([JSON.stringify(ourRef, null, 2)], {
      type: "application/json"
    }))
    // hack to trigger the download,
    let anchor = $('<a>ok</a>').attr('href', url).attr('download', savename.value + '.json').get(0)
    $(document.body).append(anchor)
    anchor.click()
  }

  svbutton.onChange = (val) => {
    dishit()
  }

  this.loop = () => {
    if(inobj.io()){
      ourRef = inobj.get()
    }
    if(intrig.io()){
      intrig.get()
      dishit()
    }
  }
}
