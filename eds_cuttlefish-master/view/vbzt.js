/*
view/vbzt.js

bezier drawing

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/


/* ---------------------------        ---------------------------- */
/* ----------------------- DRAWING BEZIERS ----------------------- */
/* ---------------------------        ---------------------------- */

function BezierTools(View) {
  let view = View

  let svg = {}
  let svgns = 'http://www.w3.org/2000/svg'

  this.getRightHandle = (div) => {
    let x = div.offsetParent.offsetLeft + (div.offsetLeft + div.clientWidth)
    let y = div.offsetParent.offsetTop + (div.offsetTop + div.clientHeight / 2)
    return {
      x: x,
      y: y
    }
  }

  this.getLeftHandle = (div) => {
    let x = div.offsetParent.offsetLeft + (div. offsetLeft)
    let y = div.offsetParent.offsetTop + (div.offsetTop + div.clientHeight / 2)
    return {
      x: x,
      y: y
    }
  }

  this.getFloaterHandle = (div) => {
    let x = parseFloat(div.style.left)
    let y = parseFloat(div.style.top) + (div.clientHeight / 2)
    return {
      x: x,
      y: y
    }
  }

  this.clear = () => {
    // pick out svg elements and delete them ?
    $(view.plane).children('.svg').remove()
  }

  let redrawBezier = (bz) => {
    var bl = Math.sqrt(Math.pow((bz.x1 - bz.x2), 2) + Math.pow((bz.y1 - bz.y2), 2)) * 0.6
    var ps = 'M ' + bz.x1 + ' ' + bz.y1 + ' C ' + (bz.x1 + bl) + ' ' + bz.y1
    var pe = ' ' + (bz.x2 - bl) + ' ' + bz.y2 + ' ' + bz.x2 + ' ' + bz.y2
    bz.elem.setAttribute('d', ps + pe)
  }

  let newBezier = (head, tail, width) => {
    var bz = {}
    bz.elem = document.createElementNS(svgns, 'path')
    bz.elem.style.stroke = '#1a1a1a'
    bz.elem.style.fill = 'none'
    bz.elem.style.strokeWidth = width + 'px'
    //bz.elem.style.zIndex = '-1'``
    bz.x1 = 0
    bz.y1 = 0
    bz.x2 = tail.x - head.x
    bz.y2 = tail.y - head.y
    redrawBezier(bz)
    return bz
  }

  this.writeBezier = (head, tail) => {
    let svg = document.createElementNS(svgns, 'svg')
    svg.style.position = 'absolute'
    svg.style.left = head.x + 'px'
    svg.style.top = head.y + 'px'
    //svg.style.zIndex = '-1'
    svg.style.overflow = 'visible'
    svg.setAttribute('width', 12)
    svg.setAttribute('height', 12)
    svg.setAttribute('class', 'svg')
    //svg.setAttribute('id', 'svg' + '_' + id)
    let bz = newBezier(head, tail, 7)
    svg.appendChild(bz.elem)
    view.plane.append(svg)
    return bz.elem
  }

  // these are 'def' objects
  this.drawLink = (output, input) => {
    let head = this.getRightHandle(output.de)
    let tail = this.getLeftHandle(input.de)
    let bz = this.writeBezier(head, tail)
    bz.addEventListener('mouseenter', (evt) => {
      bz.style.stroke = 'blue'
    })
    bz.addEventListener('mouseout', (evt) => {
      bz.style.stroke = '#1a1a1a'
    })
    bz.addEventListener('contextmenu', (evt) => {
      evt.preventDefault()
      evt.stopPropagation()
      // nice
      view.requestRemoveLink(output, input).then(() => {
        //console.log('req to rm link promise ok')
      })
    })
  }
}

export default BezierTools
