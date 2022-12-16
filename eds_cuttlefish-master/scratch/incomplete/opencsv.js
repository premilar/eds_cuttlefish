/*

open csv, setup outputs for fields (?)

INCOMPLETE: have to fix 'replaceDef' in the view ... scuttles the HTML, but should only update the
inputs / outputs ...
in general: hunk polymorphism is tough ?

*/

import {
  Hunkify,
  Input,
  Output,
  State
} from '../hunks.js'

import { CSV } from '../../libs/csv.js'

export default function OpenCSV() {
  Hunkify(this)

  let names = []
  let records = []
  let updates = []
  let headerCount = new State('number', 'header rows', 2)
  let syncOption = new State('boolean', 'synchronous', true)
  let releaseData = new State('boolean', 'release', false)
  this.states.push(headerCount, syncOption, releaseData)
  releaseData.onChange = (value) => {
    for (let i in updates) {
      updates[i] = true
    }
  }

  // trouble with this method: on restore program, no outputs will exist...
  let writeOutputs = () => {
    console.log('records', records)
    // ensure our list is this long:
    this.outputs.length = records[0].length
    // and sweep,
    for (let i in records[0]) {
      // if we have it already, and it's the same type, maintain connections...
      if (this.outputs[i] && this.outputs[i].type === typeof records[i][0]) {
        this.outputs[i].name = names[i]
        continue
      } else {
        this.outputs[i] = new Output(typeof records[i][0], names[i], this)
      }
    }
    // and reset
    this.mgr.evaluateHunk(this)
  }

  let readCsv = (file) => {
    let reader = new FileReader()
    reader.onload = (evt) => {
      let parsed = CSV.parse(evt.target.result)
      console.log('parsed', parsed)
      // ok,
      if (headerCount.value) {
        for (let i = 0; i < parsed[0].length; i++) {
          names[i] = ''
          for (let j = 0; j < headerCount.value; j++) {
            names[i] += `${parsed[j][i]}`
          }
        }
        // make header names by this row, otherwise do by types
      } else {
        for (let i = 0; i < parsed[0].length; i++) {
          names[i] = typeof parsed[0][i]
        }
      }
      // have names,
      console.log('names', names)
      // records, less headers
      records = parsed.slice(headerCount.value)
      // all should ship:
      updates.length = 0
      for (let i in parsed[0]) {
        updates.push(true)
      }
      // now we can write outputs:
      writeOutputs()
    }
    reader.readAsText(file)
  }

  this.init = () => {
    this.dom = $('<div>').get(0)
  }

  this.onload = () => {
    let btn = $('<input type="file" accept=".csv">').get(0)
    $(btn).on('change', (evt) => {
      readCsv(evt.target.files[0])
    })
    $(this.dom).append(btn)
  }

  this.loop = () => {
    // flow behaviour: if 'sync', check all clear and all updated, then ship all
    // if not sync, ship any that are updated & clear
    if(this.outputs.length < 1) return
    // continue...
    if(syncOption.value){
      // synchronous shipments
      let clear = true
      for(let o in this.outputs){
        if(this.outputs[o].io()) clear = false
        if(!updates[o]) clear = false
      }
      if(clear){
        for(let o in this.outputs){
          this.outputs[o].put(records[o])
        }
      }
    } else {
      // spaghetti shipments
      for(let o in this.outputs){
        if(updates[o] && !this.outputs[o].io()){
          this.outputs[o].put(records[o])
        }
      }
    }
  }

}
