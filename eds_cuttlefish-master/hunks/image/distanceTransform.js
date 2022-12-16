/*
hunks/image/distanceTransform.js

find distance to nearest pixel

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

export default function distanceTransform() {
  // this fn attaches handles to our function-object,
  Hunkify(this);

  // inputs
  let imageIn = new Input("ImageData", "image", this);
  this.inputs.push(imageIn);

  // states

  // outputs
  let imageOut = new Output("Float32Array", "image", this);
  this.outputs.push(imageOut);

  let width = new Output("number", "width", this);
  this.outputs.push(width);

  let height = new Output("number", "height", this);
  this.outputs.push(height);

  // yonder worker f'n
  function work() {
    self.onmessage = function(e) {
      const distanceTransformHelper = imageRGBA => {
        // const ny = imageRGBA.height;
        // const nx = imageRGBA.width;
        // var input = new Uint8ClampedArray(imageRGBA.buffer)
        // var output = new Float32Array(nx*ny)

        //helpers
        // const distance = (g, x, y, i) => (y-i)*(y-i) + g[i][x]*g[i][x];
        //
        // const intersection = (g, x, y0, y1) => (g[y0][x]*g[y0][x] - g[y1][x]*g[y1][x] + y0*y0 - y1*y1)/(2.0*(y0-y1));

        var ny = imageRGBA.height;
        var nx = imageRGBA.width;
        var input = imageRGBA.data;
        var output = new Float32Array(nx * ny);

        function distance(g, x, y, i) {
          return (y - i) * (y - i) + g[i][x] * g[i][x];
        }

        function intersection(g, x, y0, y1) {
          return (
            (g[y0][x] * g[y0][x] -
              g[y1][x] * g[y1][x] +
              y0 * y0 -
              y1 * y1) /
            (2.0 * (y0 - y1))
          );
        }
        //
        // allocate arrays
        //
        var g = [];
        for (var y = 0; y < ny; ++y) g[y] = new Uint32Array(nx);
        var h = [];
        for (var y = 0; y < ny; ++y) h[y] = new Uint32Array(nx);
        var distances = [];
        for (var y = 0; y < ny; ++y) distances[y] = new Uint32Array(nx);
        var starts = new Uint32Array(ny);
        var minimums = new Uint32Array(ny);
        var d;
        //
        // column scan
        //
        for (var y = 0; y < ny; ++y) {
          //
          // right pass
          //
          var closest = -nx;
          for (var x = 0; x < nx; ++x) {
            if (input[(ny - 1 - y) * nx * 4 + x * 4 + 0] != 0) {
              g[y][x] = 0;
              closest = x;
            } else g[y][x] = x - closest;
          }
          //
          // left pass
          //
          closest = 2 * nx;
          for (var x = nx - 1; x >= 0; --x) {
            if (input[(ny - 1 - y) * nx * 4 + x * 4 + 0] != 0) closest = x;
            else {
              d = closest - x;
              if (d < g[y][x]) g[y][x] = d;
            }
          }
        }
        //
        // row scan
        //
        for (var x = 0; x < nx; ++x) {
          var segment = 0;
          starts[0] = 0;
          minimums[0] = 0;
          //
          // down
          //
          for (var y = 1; y < ny; ++y) {
            while (
              segment >= 0 &&
              distance(g, x, starts[segment], minimums[segment]) >
              distance(g, x, starts[segment], y)
            )
              segment -= 1;
            if (segment < 0) {
              segment = 0;
              minimums[0] = y;
            } else {
              var newstart = 1 + intersection(g, x, minimums[segment], y);
              if (newstart < ny) {
                segment += 1;
                minimums[segment] = y;
                starts[segment] = newstart;
              }
            }
          }
          //
          // up
          //
          for (var y = ny - 1; y >= 0; --y) {
            d = Math.sqrt(distance(g, x, y, minimums[segment]));
            output[(ny - 1 - y) * nx + x] = d;
            if (y == starts[segment]) segment -= 1;
          }
        }

        return output;
      };

      const newOut = distanceTransformHelper(e.data);
      self.postMessage(newOut);
    };
  }

  let stash = {}
  let haveData = false
  let working = false

  //loop
  this.loop = () => {
    // if we have previously completed work, and clear outputs, ship 'em
    if(haveData && !imageOut.io() && !width.io() && !height.io()){
      imageOut.put(stash.data)
      width.put(stash.inputImage.width)
      height.put(stash.inputImage.height)
      haveData = false
    }
    // if we donot have previously completed work (i.e. a clear stash)
    // and work todo, do it
    if (imageIn.io() && !working && !haveData) {
      stash.inputImage = imageIn.get()

      var blob = new Blob(["(" + work.toString() + "())"]);
      var url = window.URL.createObjectURL(blob);
      var worker = new Worker(url);

      worker.onmessage = e => {
        const message = e.data;
        stash.data = e.data
        worker.terminate();
        working = false
        haveData = true 
      };

      // this assumes succes, but OK
      working = true
      worker.postMessage(stash.inputImage);
    }
  };
}
