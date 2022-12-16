/*
view/vdom.js

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// ay

function DomTools(View) {
  let view = View

  /* ---------------------------    ---------------------------- */
  /* -------------------- DRAWING & MOVING --------------------- */
  /* ---------------------------    ---------------------------- */

  // a utility to write a numbers-ordered transform object into the dom,
  this.writeTransform = (div, tf) => {
    //console.log('vname, div, tf', view.name, div, tf)
    if(tf.s){
      div.style.transform = `scale(${tf.s})`
    } else {
      div.style.transform = `scale(1)`
    }
    //div.style.transformOrigin = `${tf.ox}px ${tf.oy}px`
    div.style.left = `${tf.x}px`
    div.style.top = `${tf.y}px`
  }

  // a utility to do the same, for the background, for *the illusion of movement*,
  // as a note: something is wrongo with this, background doth not zoom at the same rate...
  this.writeBackgroundTransform = (div, tf) => {
    div.style.backgroundSize = `${tf.s * 100}px ${tf.s * 100}px`
    div.style.backgroundPosition = `${tf.x + 50*(1-tf.s)}px ${tf.y + 50*(1-tf.s)}px`
  }

  // a uility to read those transforms out of elements,
  this.readTransform = (div) => {
    // transform, for scale
    let transform = div.style.transform
    let index = transform.indexOf('scale')
    let left = transform.indexOf('(', index)
    let right = transform.indexOf(')', index)
    let s = parseFloat(transform.slice(left + 1, right))

    // left and right, position
    let x = parseFloat(div.style.left)
    let y = parseFloat(div.style.top)

    return ({
      s: s,
      x: x,
      y: y
    })
  }

  this.readContainerWidth = (div) => {
    return {
      x: div.clientWidth,
      y: div.clientHeight
    }
  }

  // these two are used in the floop, to build arrays of things to push around
  this.readXY = (div) => {
    //console.log('READXY left', div.style.left, 'top', div.style.top)
    return {
      x: parseFloat(div.style.left),
      y: parseFloat(div.style.top)
    }
  }

  // and to determine how large to make the circle for pushing against
  this.readSize = (div) => {
    return {
      width: div.clientWidth,
      height: div.clientHeight
    }
  }

  // using this inside of defs, during explode, but not otherwise ..
  this.makeDraggable = (elem, handle, callback) => {
    handle.onmousedown = (evt) => {
      evt.preventDefault()
      evt.stopPropagation()

      if(callback) elem.onMoveCustomCallback = callback

      let domElemMouseMove = (evt) => {
        // TRANSFORMS here to move div about on drag
        evt.preventDefault()
        evt.stopPropagation()
        let ct = this.readTransform(elem)
        let pt = this.readTransform(view.plane)
        ct.x += evt.movementX / pt.s
        ct.y += evt.movementY / pt.s
        this.writeTransform(elem, ct)
        if(elem.onMoveCustomCallback) elem.onMoveCustomCallback(ct)
        view.drawLinks()
      }

      function rmOnMouseUp(evt) {
        document.removeEventListener('mousemove', domElemMouseMove)
        document.removeEventListener('mouseup', rmOnMouseUp)
      }

      document.addEventListener('mousemove', domElemMouseMove)
      document.addEventListener('mouseup', rmOnMouseUp)
    }
  }

  // also only using this for the view atm,
  this.makeResizeable = (elem, callback, notify) => {
    // yikes, messy dom
    elem.onResizeCustomCallback = callback
    // more band aid
    if(notify) elem.onResizeCustomNotify = notify
    // first we put a handle in the bottom,
    let handle = $(`<div>`).append('<i class="em em-arrow_lower_right"></i>').addClass('resizehandle').get(0)
    $(elem).append(handle)
    // track, can we go outside?
    let w = elem.clientWidth
    let h = elem.clientHeight
    this.writeTransform(handle, {x: w, y: h})
    // make
    elem.requestResize = (x, y) => {
      //console.log('request resize', x, y, 'on', elem)
      $(elem).css('width',`${x}px`).css('height', `${y}px`)
      this.writeTransform(handle, {x: x, y: y})
      elem.onResizeCustomCallback()
      if(elem.onResizeCustomNotify) elem.onResizeCustomNotify()
    }
    // ++ or --
    handle.onmousedown = (evt) => {
      evt.preventDefault()
      evt.stopPropagation()
      // doing this once, so not covered for scroll-while-drag, but ...
      let vt = this.readTransform(view.plane)
      // on move,
      let domElemMouseMove = (evt) => {
        evt.preventDefault()
        evt.stopPropagation()
        let dw = evt.movementX / vt.s
        let dh = evt.movementY / vt.s
        let cw = (parseInt($(elem).css('width')) + dw)
        let ch = (parseInt($(elem).css('height')) + dh)
        elem.requestResize(cw, ch)
      }
      function rmOnMouseUp(evt) {
        document.removeEventListener('mousemove', domElemMouseMove)
        document.removeEventListener('mouseup', rmOnMouseUp)
      }
      document.addEventListener('mousemove', domElemMouseMove)
      document.addEventListener('mouseup', rmOnMouseUp)
    }
  }
}

export default DomTools
