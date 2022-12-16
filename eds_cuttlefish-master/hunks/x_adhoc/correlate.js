/*
hunks/x_adhoc/correlate.js

attempt for barebones template matching w/ cross correlation dot product

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

function worker(){
  'use strict'
  let correlateGrayscale = (a, b, x, y) => {
    // score a against b, starting b from x, y
    // a, b are float64 arrays, pixel-wise
    let sumA = 0
    let sumB = 0
    let sumDot = 0
    // i will be index within the flat-af array under a,
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < a[0].length; j++) {
        sumA += a[i][j]
        sumB += b[i + x][j + y]
        sumDot += a[i][j] * b[i + x][j + y]
      }
    }
    // I'm still not convinced this is a really great filter
    return sumDot / Math.sqrt((sumB * sumB) * (sumA * sumA))
  }

  let correlateRBGA = (a, b, x, y) => {
    let ai, bi
    let sumA = 0
    let sumB = 0
    let sumDot = 0
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < a[0].length; j++) {
        ai = a[i][j]
        bi = b[i + x][j + y]
        // have two vals,
        a[i][j] // has [0-3] rgba
        b[i + x][j + y] // has [0-3] rgba
        // so ? per pixel, this is like:
        let pdb = ai[0] * bi[0] + ai[1] * bi[1] + ai[2] * bi[2]
        let pas = ai[0] + ai[1] + ai[2]
        let pbs = bi[0] + bi[1] + bi[2]
        let pps = pdb / Math.sqrt(pas * pas * pbs * pbs) // per pixel score,
        sumA += pas
        sumB += pbs
        sumDot += pdb
      }
    }
    return sumDot / Math.sqrt(sumA * sumA * sumB * sumB)
  }

  let packGrayscale = (imgD) => {
    // make an md array shaped like[x][y]
    let arr = []
    for (let x = 0; x < imgD.width; x++) {
      arr.push(new Float64Array(imgD.height))
    }
    let p = 0
    for (let y = 0; y < imgD.height; y++) {
      for (let x = 0; x < imgD.width; x++) {
        // grayscale all values as we load them up:
        arr[x][y] = (imgD.data[p] + imgD.data[p + 1] + imgD.data[p + 2]) / 3 // + imgD.data[p + 3]) / 4;
        p += 4;
      }
    }
    return arr
  }

  let packRBGA = (imgD) => {
    let arr = []
    for (let x = 0; x < imgD.width; x++) {
      arr.push([])
      for (let y = 0; y < imgD.height; y++) {
        arr[x][y] = new Float64Array(4)
      }
    }
    let p = 0
    for (let y = 0; y < imgD.height; y++) {
      for (let x = 0; x < imgD.width; x++) {
        arr[x][y][0] = imgD.data[p++]
        arr[x][y][1] = imgD.data[p++]
        arr[x][y][2] = imgD.data[p++]
        arr[x][y][3] = imgD.data[p++]
      }
    }
    return arr
  }

  function run(a, b) {
    // a is img to search for, b is img to search within. both are ImageData types
    let resX = b.width - a.width
    let resY = b.height - a.height
    let numruns = resX * resY
    // the move now is to make an md array of these values,
    let bArr = packGrayscale(b) //packRBGA(b) //packGrayscale(b)
    let aArr = packGrayscale(a) //packGrayscale(a)
    // ok, results array like[x][y]
    let result = []
    for (let x = 0; x < resX; x++) {
      result.push(new Float64Array(resY))
    }
    // now fill,
    for (let x = 0; x < resX; x++) {
      for (let y = 0; y < resY; y++) {
        result[x][y] = correlateGrayscale(aArr, bArr, x, y)//correlateRBGA(aArr, bArr, x, y)
      }
    }
    // make image from the result,
    let max = -Infinity
    let min = Infinity
    let mp = { x: 0, y: 0 }
    for (let x = 0; x < resX; x++) {
      for (let y = 0; y < resY; y++) {
        if (result[x][y] > max) {
          max = result[x][y]
          mp.x = x
          mp.y = y
        }
        if (result[x][y] < min) min = result[x][y]
      }
    }
    // now we want to unwrap this into an imagedata type,
    // filling back in grayscale type
    let imdBuffer = new Uint8ClampedArray(resX * resY * 4)
    let lc = 0
    let dt = 0
    for (let y = 0; y < resY; y++) {
      for (let x = 0; x < resX; x++) {
        // stretch to full range,
        dt = (result[x][y] - min) * (255 / (max - min))
        imdBuffer[lc++] = dt
        imdBuffer[lc++] = dt
        imdBuffer[lc++] = dt
        imdBuffer[lc++] = 255
      }
    }
    let imgRes = new ImageData(imdBuffer, resX, resY)
    self.postMessage(imgRes)
  }

  onmessage = (evt) => {
    run(evt.data.a, evt.data.b)
  }
}

let computedResult = null
let running = false

export default function Correlate() {
  Hunkify(this)

  let imgIn = this.input('ImageData', 'frame')
  let resOut = this.output('ImageData', 'correlation')

  let canvasA = $('<canvas>').get(0)
  canvasA.width = 24
  canvasA.height = 24
  let ctxA = canvasA.getContext('2d')
  ctxA.width = 24
  ctxA.height = 24

  let canvasB = $('<canvas>').get(0)
  let ctxB = canvasB.getContext('2d')

  this.dom = $('<div>').get(0)

  let webWorker

  this.init = () => {
    // startup the worker:
    let bleb = new Blob(['('+worker.toString()+'())'])
    let url = window.URL.createObjectURL(bleb)
    webWorker = new Worker(url)
    webWorker.addEventListener('message', (evt) => {
      running = false
      if(!resOut.io()){
        resOut.put(evt.data)
      }
    })
  }

  this.onload = () => {
    $(this.dom).append(canvasA)
    $(this.dom).append(canvasB)
  }

  this.loop = () => {
    if (imgIn.io() && !running) {
      /*
      imgIn.get()
      running = true
      console.log("POSTING")
      webWorker.postMessage('msg')
      */
      // ok, the image data:
      let img = imgIn.get()
      // to scale this thing, we draw it into a canvas (virtual ... not attached to page)
      let vc = $('<canvas>').get(0)
      let scale = 256 / img.height
      vc.width = img.width
      vc.height = img.height
      vc.getContext('2d').putImageData(img, 0, 0)
      // we draw this into a second canvas, scaling it with the drawImage call,
      canvasB.width = img.width * scale
      canvasB.height = img.height * scale
      ctxB.drawImage(vc, 0, 0, img.width * scale, img.height * scale)
      // now we can pull the imagedata (scaled) from here,
      let b = ctxB.getImageData(0, 0, canvasB.width, canvasB.height)
      // and the thing we want to find, to test, just pick the middle:
      //let a = ctxB.getImageData(b.width / 2, b.height / 2, 25, 25)
      // and write that out, to debug ...
      //ctxA.putImageData(a, 0, 0)
      ctxA.fillStyle = 'white'
      ctxA.fillRect(0,0,24,24)
      ctxA.fillStyle = 'black'
      // ctxA.arc(12,12,8, 0, 2*Math.PI)
      // ctxA.fillStyle = 'black'
      // ctxA.fill()
      ctxA.fillRect(0,0,12,12)
      ctxA.fillRect(12,12,24,24)
      let a = ctxA.getImageData(0,0,24,24)
      webWorker.postMessage({a: a, b: b})
      running = true
    }
  }
}

/*
let img = imgIn.get()
let width = img.width
// to ah grayscale array,
let gs = []
let sum = 0
let avg = 0
for(let i = 0; i < img.data.length; i += 4){
  sum = 0
  sum += img.data[i]
  sum += img.data[i + 1]
  sum += img.data[i + 2]
  avg = sum / 3
  gs.push(avg) //, avg, avg, 255)
}
//let gray = new ImageData(Uint8ClampedArray.from(gs), img.width, img.height)
//imgOut.put(gray)
// conv. to grayscale,
// think we need this img ah grayscale array
// fft that ...
*/
