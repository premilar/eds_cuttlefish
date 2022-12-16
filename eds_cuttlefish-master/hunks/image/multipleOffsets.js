/*
hunks/image/multipleOffsets.js

write multiple offsets from distance field 

Jake Read at the Center for Bits and Atoms with Neil Gershenfeld and Leo McElroy
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/
/*

hunk template

*/

// these are ES6 modules
import { Hunkify, Input, Output, State } from "../hunks.js";
import { TSET } from "../../typeset.js";

/*
  import {
    html,
    svg,
    render
  } from 'https://unpkg.com/lit-html?module';
  */

export default function MultipleOffsets() {
  // this fn attaches handles to our function-object,
  Hunkify(this);

  // inputs
  let imageIn = new Input("Float32Array", "image", this);
  this.inputs.push(imageIn);

  let width = new Input("number", "width", this);
  this.inputs.push(width);

  let height = new Input("number", "height", this);
  this.inputs.push(height);

  // states
  let totalOffset = new State("number", "totalOffset", 0.5);
  this.states.push(totalOffset);

  let offsetDiameter = new State("number", "offsetDiameter", 0.5);
  this.states.push(offsetDiameter);

  let stepover = new State("number", "stepover", 0.5);
  this.states.push(stepover);

  // outputs
  let vectors = new Output("array", "Vectors", this);
  this.outputs.push(vectors);

  // view
  // this.dom = {}
  this.init = () => {
    //this.dom = $('<div>').get(0)
  };

  /*
    this.onload = () => {}
    */

  this.loop = () => {
    if (imageIn.io() && !vectors.io()) {
      function work() {
        //imports pipe, edgeDetectHelper, orientEdgesHelper, vectorizeHelper; could be a good idea to break these into different files
        self.importScripts("http://localhost:8080/helpers.js");

        self.onmessage = function(e) {

          let vectors = [];
          let offset = e.data.offsetDiameter;

          let newVectors;

          while (offset <= e.data.totalOffset) {

            newVectors = pipe(
              x => offsetHelper(x.imageIn, offset, x.width, x.height),
              edgeDetectHelper,
              orientEdgesHelper,
              vectorizeHelper
            )(e.data);

            vectors.push(...newVectors);

            // we only want this to run once if the totalOffset is the offsetDiameter
            if (offset === e.data.totalOffset) break;

            offset += e.data.stepover;

            if (offset > e.data.totalOffset) {
              offset = e.data.totalOffset;
            }

          }

          self.postMessage(vectors);
        };
      }

      var blob = new Blob(["(" + work.toString() + "())"]);
      var url = window.URL.createObjectURL(blob);
      var worker = new Worker(url);

      worker.onmessage = e => {
        const message = e.data;
        vectors.put(message);
        worker.terminate();
      };

      worker.postMessage({
        imageIn: imageIn.get(),
        width: width.get(),
        height: height.get(),
        totalOffset: totalOffset.value,
        offsetDiameter: offsetDiameter.value,
        stepover: stepover.value,
      });
    }
  };
}
