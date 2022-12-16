/*
hunks/image/readpng.js

gather PNG image from the aether 

Jake Read at the Center for Bits and Atoms with Neil Gershenfeld and Leo McElroy
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/
/* hunk template */

// these are ES6 modules
import { Hunkify, Input, Output, State } from "../hunks.js";

import { html, svg, render } from "https://unpkg.com/lit-html?module";

export default function UploadPNG() {
  // this fn attaches handles to our function-object,
  Hunkify(this);

  // keeping these local globals,
  let idealWidth = 395; // (want to pull width out of some API for this.dom - element width .. have resize..)
  let localImageInfo = null;
  let imageUpdated = false;
  let localDpi = null
  let dpiUpdated = false

  // it looks like 'RGBA' types are actually ImageData objects,
  // https://developer.mozilla.org/en-US/docs/Web/API/ImageData
  // since we will be using these in canvas-contexts, makes sense to just use these types
  let imageOut = this.output("ImageData", "image")
  let dpiOut = this.output('number', 'dpi')

  // as a hack, we can use boolean state variables as a button: they have handy callbacks...
  const trig = new State("boolean", "release", false);
  this.states.push(trig);
  trig.onChange = (value) => {
    // I'll set this flag so that we will release image info on the next loop
    // if any is available,
    imageUpdated = true
    dpiUpdated = true
  };

  // names for elements,
  let canvasUid, inputItemUid;

  this.init = () => {
    this.dom = $("<div>").get(0);
    canvasUid = `${this.name}_canvas_dom`;
    inputItemUid = `${this.name}_input`;
  };

  //import
  const png_read_handler = e => {
    const imageReader = new FileReader();
    const files = e.target.files;
    const file = files[0];
    const img = new Image();
    img.file = file;
    const imageLoader = aImg => e => {
      // binary:
      let raw = e.target.result
      // useful:
      aImg.src = raw;
      aImg.onload = () => {
        // OK: sometimes this image is *way too big* to dump into the DOM,
        // so we write it into a new and virtual canvas that we won't render:
        let virtualCanvas = $("<canvas>").get(0);
        virtualCanvas.width = aImg.width;
        virtualCanvas.height = aImg.height;
        let vContext = virtualCanvas.getContext("2d");
        vContext.drawImage(aImg, 0, 0);
        // great, now we can use this to pull normalized ImageData information, this is what we pass around:
        localImageInfo = vContext.getImageData(0, 0, aImg.width, aImg.height);
        imageUpdated = true;
        // now we can draw something:
        const canvas = document.getElementById(`${canvasUid}`);
        // we'll want to shrink the whole thing ... or enlarge,
        let scale = idealWidth / aImg.width;
        // the height and width of the actual image,
        canvas.width = aImg.width * scale;
        canvas.height = aImg.height * scale;
        // and then we draw into it,
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(aImg, 0, 0);
      };
    };
    imageReader.onload = imageLoader(img);
    imageReader.readAsDataURL(file);
    // and ah data version...
    const headerLoader = (event) => {
      console.log('e', event.target.result)
      // https://gitlab.cba.mit.edu/pub/mods/blob/master/modules/read/png
      //
      // get DPI
      //
      // 8 header
      // 4 len, 4 type, data, 4 crc
      // pHYs 4 ppx, 4 ppy, 1 unit: 0 ?, 1 meter
      // IEND
      //
      var units = 0
      var ppx = 0
      var ppy = 0
      var dpi = 0
      var buf = event.target.result
      var view = new DataView(buf)
      var ptr = 8
      if (!((view.getUint8(1) == 80) && (view.getUint8(2) == 78) && (view.getUint8(3) == 71))) {
        console.warn("error: PNG header not found")
        return
      }
      while (1) {
        var length = view.getUint32(ptr)
        ptr += 4
        var type = String.fromCharCode(
          view.getUint8(ptr), view.getUint8(ptr + 1),
          view.getUint8(ptr + 2), view.getUint8(ptr + 3))
        ptr += 4
        if (type == "pHYs") {
          ppx = view.getUint32(ptr)
          ppy = view.getUint32(ptr + 4)
          units = view.getUint8(ptr + 8)
        }
        if (type == "IEND")
          break
        ptr += length + 4
      }
      if (units == 0) {
        console.warn("no PNG units not found, assuming 72 DPI")
        ppx = 72 * 1000 / 25.4
      }
      localDpi = ppx * 25.4 / 1000
      dpiUpdated = true
      if(localImageInfo){
        let width = localImageInfo.width * ((dpi*1000) / 25.4)
        let height = localImageInfo.height * ((dpi*1000) / 25.4)
        console.warn(`size in mm is w: ${width.toFixed(3)}, h: ${height.toFixed(3)}`)
      }
      console.log('dpi', localDpi)
    }
    let headerReader = new FileReader()
    headerReader.onload = headerLoader
    headerReader.readAsArrayBuffer(file)
  };

  this.onload = () => {
    const target = $("<div>").get(0);
    $(this.dom).append(target);
    // to name unique DOM elements, if we want to access them later using 'get element' methods,
    // we can prepend the hunk's name (which is unique)
    const view = html `
      <style>
        #${inputItemUid} {
          margin: 5px;
        }
        #${canvasUid} {
          border: 0px solid black;
          margin: 5px;
        }
      </style>
      <input
        id=${inputItemUid}
        type="file"
        accept="image/png"
        @input=${e => png_read_handler(e)}>
      </input>
      <canvas
        id=${canvasUid}
        width=100
        height=100>
      </canvas>
    `;
    render(view, target);
  };

  this.loop = () => {
    // we release data if we have any, if it's been updated, and if the output is clear:
    if (localImageInfo && imageUpdated && !imageOut.io()) {
      //console.log(`${this.name} puts:`, localImageInfo);
      imageUpdated = false;
      imageOut.put(localImageInfo);
    }
    if(localDpi && dpiUpdated && !dpiOut.io()){
      dpiUpdated = false
      dpiOut.put(localDpi)
    }
  };
}
