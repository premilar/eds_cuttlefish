/*
hunks/x_adhoc/open-4411-csv.js

open csv of 4411 data 

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

import { CSV } from '../../libs/csv.js'

export default function OpenCSV() {
  Hunkify(this)

  let outref = new Output('reference', 'data', this)
  this.outputs.push(outref)

  let readCsv = (file) => {
    let reader = new FileReader()
    reader.onload = (evt) => {
      let parsed = CSV.parse(evt.target.result)
      // wrip headers off
      let records = parsed.slice(2)
      let zc = records.findIndex((elem) => {
        return elem[1] > 0
      })
      console.log('zc', zc)
      records = records.slice(zc)
      let adjusted = []
      for(let item of records){
        adjusted.push([item[1], item[2]])
      }
      // now we can write outputs
      outref.put(adjusted)
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
  }

}
