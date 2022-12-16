/*
hunks/image/thresholdRGBA.js

threshold an image

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

export default function Threshold() {
  // this fn attaches handles to our function-object,
  Hunkify(this);

  // inputs
  let imageIn = new Input("ImageData", "image", this);
  this.inputs.push(imageIn);

  // states
  let threshold = new State("number", "threshold", 0.5);
  this.states.push(threshold);

  // outputs
  let imageOut = new Output("ImageData", "image", this);
  this.outputs.push(imageOut);

  // Helper Functions
  const thresholdRGBA = (imageRGBA, threshold) => {
    const w = imageRGBA.width;
    const h = imageRGBA.height;
    const buf = imageRGBA.data;
    const t = threshold;

    let r, g, b, a, i;
    for (var row = 0; row < h; ++row) {
      for (var col = 0; col < w; ++col) {
        r = buf[(h - 1 - row) * w * 4 + col * 4 + 0];
        g = buf[(h - 1 - row) * w * 4 + col * 4 + 1];
        b = buf[(h - 1 - row) * w * 4 + col * 4 + 2];
        a = buf[(h - 1 - row) * w * 4 + col * 4 + 3];
        i = (r + g + b) / (3 * 255);

        let val;
        if (a === 0) {
          val = 255;
        } else if (i > t) {
          val = 255;
        } else {
          val = 0;
        }

        buf[(h - 1 - row) * w * 4 + col * 4 + 0] = val;
        buf[(h - 1 - row) * w * 4 + col * 4 + 1] = val;
        buf[(h - 1 - row) * w * 4 + col * 4 + 2] = val;
        buf[(h - 1 - row) * w * 4 + col * 4 + 3] = 255;
      }
    }

    const imgdata = new ImageData(buf, w, h);

    return imgdata;
  };

  //loop
  this.loop = () => {
    if (imageIn.io() && !imageOut.io()) {
      const thresheld = thresholdRGBA(imageIn.get(), threshold.value);
      imageOut.put(thresheld);
    }
  };
}
