/*
hunks/data/lineChart.js

draws data to line chart

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// using https://bl.ocks.org/d3noob/402dd382a51a4f6eea487f9a35566de0

import {
  Hunkify,
  Input,
  Output,
  State
} from '../hunks.js'


function LineChart() {
  Hunkify(this)
  //
  let dtRef = new Input('reference', 'array', this)
  this.inputs.push(dtRef)
  // how many to keep
  let displayNum = new State('number', 'displayCount', 50)
  this.states.push(displayNum)

  // some global items,
  var datas = [
    [0, 0]
  ]
  let uniqueDivId = ''

  // to claim some space in the DOM, we make a handle for ourselv
  this.dom = {}

  this.init = () => {
    console.log('INIT linechart')
    // make a unique id, we use a flat d3 search to find and update this ...
    uniqueDivId = 'linechart_div_' + Math.round(Math.random() * 1000)
    this.dom = $('<div>').attr('id', uniqueDivId).get(0)
  }

  this.onload = () => {
    // our vars,
    var margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 90
      },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;
    var x = d3.scaleLinear().range([0, width])
    var y = d3.scaleLinear().range([height, 0])
    var thesvg = null
    // make ah function
    this.reloadDatas = () => {
      var valueline = d3.line()
        .x(function(d) {
          return x(d[0])
        })
        .y(function(d) {
          return y(d[1])
        })
      // scale
      x.domain([d3.min(datas, function(d) {
        return d[0]
      }), d3.max(datas, function(d) {
        return d[0];
      })])
      y.domain([d3.min(datas, function(d) {
        return d[1]
      }), d3.max(datas, function(d) {
        return d[1];
      })])
      if (thesvg) {
        d3.select(`#${uniqueDivId}`).selectAll("*").remove()
      }
      thesvg = d3.select(`#${uniqueDivId}`).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      // write it?
      thesvg.append("path")
        .data([datas])
        .attr("class", "line")
        .attr("d", valueline)
      // write the x axis
      thesvg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
      // the y axis
      thesvg.append("g")
        .call(d3.axisLeft(y))
    }
    // so then
    this.requestResize(1000, 520)
    // startup
    this.reloadDatas()
  }

  this.onresize = () => {
    console.log(this.dom.clientHeight, this.dom.clientWidth)
  }

  // hmmm
  this.loop = () => {
    // pull and append
    if (dtRef.io()) {
      // WARN to others... the -1 is here bc is it a useful hack for jake
      // at the moment ! apologies
      datas = dtRef.get()
      this.reloadDatas()
    }
  }
}

export default LineChart
