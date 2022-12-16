/*
hunks/image/renderVectors.js

display vectors 

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

import { html, svg, render } from "https://unpkg.com/lit-html?module";

export default function RenderVectors() {
  // this fn attaches handles to our function-object,
  Hunkify(this);

  // inputs
  let vectors = new Input("array", "Vectors", this);
  this.inputs.push(vectors);

  let width = new Input("number", "width", this);
  this.inputs.push(width);

  let height = new Input("number", "height", this);
  this.inputs.push(height);

  // Helper Functions
  const connectingVectors = arrayOfVectors => {
    const reducer = (acc, cur, index) =>
      index === 0
        ? [...acc, [[0, 0], cur[0], cur[cur.length - 1]]]
        : [...acc, [acc[index - 1][2], cur[0], cur[cur.length - 1]]];

    const result = arrayOfVectors
      .reduce(reducer, [])
      .map(x => x.slice(0, 2))
      .map(x => renderPolyline(x, "red"));

    return result;
  };

  const renderPolyline = (arrayOfPoints, color = "black") => {
    const pathData = `M ${arrayOfPoints
      .map(pair => `${pair[0]} ${300 - pair[1]}`)
      .join(",")}`;

    return svg`<path d="${pathData}" fill="none" stroke="${color}"></path>`;
  };

  const renderVectorsHelper = arrayOfVectors => {
    const cuts = arrayOfVectors.map(vec => renderPolyline(vec));
    const moves = connectingVectors(arrayOfVectors);

    return [...cuts, ...moves];
  };

  // view
  // this.dom = {}
  let svgUid;
  this.init = () => {
    this.dom = $("<div>").get(0);
    svgUid = `${this.name}_svg_dom`;
  };

  this.onload = () => {
    const target = $("<div>").get(0);
    $(this.dom).append(target);

    const view = html`
      <svg id=${svgUid} width="300" height="300"></svg>
    `;
    render(view, target);
  };

  //loop
  this.loop = () => {
    if (vectors.io() && width.io() && height.io()) {
      const newView = renderVectorsHelper(vectors.get());

      let svgTarget = $(this.dom)
        .find("svg")
        .get(0);

      svgTarget.viewbox = "0 0 auto auto";

      // const svgTarget = document.getElementById(svgUid);
      render(newView, svgTarget);
    }
  };
}
