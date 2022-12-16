/*
hunks/image/displayImageData.js

render imageData into a canvas in the DOM

Jake Read at the Center for Bits and Atoms with Neil Gershenfeld and Leo McElroy
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import { Hunkify, Input, Output, State } from "../hunks.js";

import { html, svg, render } from "https://unpkg.com/lit-html?module";

export default function DisplayImageData() {
  Hunkify(this);

  const imageIn = new Input("ImageData", "image", this);
  this.inputs.push(imageIn);

  let canvasUid, descriptionUid;
  let idealWidth = 395;

  this.init = () => {
    this.dom = $("<div>").get(0);
    canvasUid = `${this.name}_canvas_dom`;
    descriptionUid = `${this.name}_descrip_dom`;
  };

  this.onload = () => {
    // I would say these implementations could use some clarity / nice-ness
    // there's a real hairball to dig up in the hunks-getting-dom-elements 'system'
    // that is fair game to anyone willing to wrastle with the dom and force-layout for 1wk
    const target = $("<div>").get(0);
    $(this.dom).append(target);
    // these methods are rad !
    const view = html`
      <style>
        #${descriptionUid} {
          margin: 5px;
        }
        #${canvasUid} {
          border: 1px solid black;
          margin: 5px;
        }
      </style>
      <div id=${descriptionUid}>
        height: none, width: none
      </div>
      <canvas id=${canvasUid} width="100" height="100"> </canvas>
    `;
    render(view, target);
  };

  this.loop = () => {
    if (imageIn.io()) {
      let imageData = imageIn.get();
      // we can also get by searching through our local dom...
      let canvas = $(this.dom)
        .find("canvas")
        .get(0);
      let scale = idealWidth / imageData.width;
      // scaling these is a pain, we could use a better way (maybe css transform just-one master canvas?)
      let vCanvas = $("<canvas>").get(0);
      vCanvas.width = imageData.width;
      vCanvas.height = imageData.height;
      vCanvas.getContext("2d").putImageData(imageData, 0, 0);
      vCanvas.getContext("2d").scale(scale, scale);
      // now we can write over,
      canvas.width = imageData.width * scale;
      canvas.height = imageData.height * scale;
      // here's the underlying context we're drawing into:
      let ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // definitely want some cleaner ideas about canvases / drawing / sizes / etc
      // probably it is in drawing real-size canvases, and scaling those with css.
      ctx.scale(scale, scale);
      ctx.drawImage(vCanvas, 0, 0);
    }
  };
}
