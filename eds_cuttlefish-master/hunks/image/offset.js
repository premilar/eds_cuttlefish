/*
hunks/image/offset.js

walk along distance field 

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

/*
  import {
    html,
    svg,
    render
  } from 'https://unpkg.com/lit-html?module';
  */

export default function Offset() {
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
  let offset = new State("number", "offset", 0.5);
  this.states.push(offset);

  // outputs
  let imageOut = new Output("ImageData", "image", this);
  this.outputs.push(imageOut);

  // Helper Functions
  const offsetHelper = (distances, offset, width, height) => {
    var w = width;
    var h = height;
    var offset = offset;
    var input = distances;
    var output = new Uint8ClampedArray(4 * h * w);
    for (var row = 0; row < h; ++row) {
      for (var col = 0; col < w; ++col) {
        if (input[(h - 1 - row) * w + col] <= offset) {
          output[(h - 1 - row) * w * 4 + col * 4 + 0] = 255;
          output[(h - 1 - row) * w * 4 + col * 4 + 1] = 255;
          output[(h - 1 - row) * w * 4 + col * 4 + 2] = 255;
          output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
        } else {
          output[(h - 1 - row) * w * 4 + col * 4 + 0] = 0;
          output[(h - 1 - row) * w * 4 + col * 4 + 1] = 0;
          output[(h - 1 - row) * w * 4 + col * 4 + 2] = 0;
          output[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
        }
      }
    }

    const imgData = new ImageData(output, w, h);

    return imgData;
  };

  // view
  // this.dom = {}
  this.init = () => {
    //this.dom = $('<div>').get(0)
  };

  /*
    this.onload = () => {}
    */

  //loop
  this.loop = () => {
    if (imageIn.io() && width.io() && height.io() && !imageOut.io()) {
      const offsetted = offsetHelper(
        imageIn.get(),
        offset.value,
        width.get(),
        height.get()
      );
      imageOut.put(offsetted);
    }
  };
}
