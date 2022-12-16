/*
hunks/x_adhoc/center.js

find subpixel hotspot in grayscale image

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

import REG from '../../libs/regression.js'

export default function HotSpotHunter(){
  Hunkify(this)
  // will assume this is grayscale'd, and max-dr'd already
  let ipImg = this.input('ImageData', 'image')

  let opX = this.output('number', 'x')
  let opY = this.output('number', 'y')

  console.log('REG?', REG)

  this.dom = $('<div>').get(0)
  // one to draw into:
  let canvas = $('<canvas>').get(0)
  let ctx = canvas.getContext('2d')
  canvas.width = 395
  canvas.height = 395
  // and ah virtual friend:
  let vc = $('<canvas>').get(0)
  let vctx = vc.getContext('2d')

  this.onload = () => {
    $(this.dom).append(canvas)
  }

  this.loop = () => {
    if(ipImg.io() && !opX.io() && !opY.io()){
      let img = ipImg.get()
      // first, just hunt for abs. peak:
      // draw in to virtual,
      //ctx.putImageData(img, 0, 0)
      vc.height = img.height
      vc.width = img.width
      let scale = canvas.width / img.width
      vctx.putImageData(img, 0, 0)
      canvas.height = canvas.width * (img.height / img.width)
      ctx.drawImage(vc, 0, 0, canvas.width, canvas.height)
      // ok, that was just drawing into the canvas - we
      // want to find the center by inspecting the actual image data...
      let max = -Infinity
      let mp = {x: 0, y: 0}
      for(let i = 0; i < img.data.length; i += 4){
        if(img.data[i] > max){
          max = img.data[i]
          mp.x = i % (img.width * 4) / 4
          mp.y = Math.floor(i / (img.width * 4))
        }
      }
      // if we try to fit a quadratic across some domain, centered here... I need to collect
      // *the appropriate data*
      // this is easiest in the x-dir bf oc the data shape
      let xSamples = []
      let ySamples = []
      let xCI = mp.y * (img.width * 4) + (mp.x * 4)// center index
      for(let i = -10; i < 11; i ++){
        xSamples.push([i, img.data[xCI + i * 4]])
        ySamples.push([i, img.data[xCI + i * 4 * img.width]])
      }
      //console.log('samp', xSamples)
      let regX = REG.polynomial(xSamples, {order: 2, precision: 6})
      let regY = REG.polynomial(ySamples, {order: 2, precision: 6})
      //console.log('ret', ret)
      // vertex is -b / 2a
      let xVert = -regX.equation[1] / (2*regX.equation[0])
      let yVert = -regY.equation[1] / (2*regY.equation[0])
      mp.x += xVert
      mp.y += yVert
      //console.log('mp.x, .y', mp.x, mp.y)
      // that's great, let's draw it:
      ctx.beginPath()
      ctx.moveTo(mp.x * scale, 0)
      ctx.lineTo(mp.x * scale, canvas.height)//ctx.height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, mp.y * scale)
      ctx.lineTo(canvas.width, mp.y * scale)
      ctx.stroke()
      //ctx.arc(mp.x * scale, mp.y * scale, 8, 0, 2*Math.PI)
      //ctx.stroke()
      // and ship em
      opX.put(mp.x)
      opY.put(mp.y)
    }
  }
}
