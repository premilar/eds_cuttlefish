/*
view/vfloater.js

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import DomTools from './vdom.js'

function Floater(view, grouptype) {
  // want one,
  // altho, non-ideal ...
  let dt = new DomTools(view)
  // TODO:
  /*
  ... think ... think ...
  -> button to expand, and gather? div-related?
  -> button drags as well ? titlematter does hover, not drag, two funcitons ?
  -> !!!!!!!!!!!!! button for fixed ! fixed !!!!!!!!!!!!!!!
  -> roll sim back, so that fixed / unfixed is meaningful
  -> explosions afterwards
  */
  // a floater is an individual that can be dragged, fixed/unfixed, etc
  // it is exactly the thing we give to d3 to lay out
  this.x = 0
  this.y = 0
  // want these,
  this.w = 101
  this.h = 101
  // if it has fx, fy, it is fixed
  this.r = 101 // to default,
  // these are handy,
  this.bb = {}
  this.bb.x1 = -50
  this.bb.y1 = -50
  this.bb.x2 = 51
  this.bb.y2 = 51
  // by default, no
  this.isFixed = false
  // will have this to track within simulation links
  this.simIndex = null

  // every floater has *at least* this ...
  // this is where we put the buttonz
  this.ownElement = $(`<div>`).addClass('float').get(0)
  $(this.ownElement).append(`<i class="em em-pushpin"></i>`)
  $(this.ownElement).on('click', (evt) => {
    if (this.isFixed === true) {
      this.free()
    } else {
      this.fix()
    }
  }).on('mouseover', (evt) => {
    document.body.style.cursor = 'pointer'
  }).on('mouseout', (evt) => [
    document.body.style.cursor = 'auto'
  ])
  $(view.plane).append(this.ownElement)
  // fixed <i class="em em-round_pushpin"></i>
  // open <i class="em em-pushpin"></i>

  // this is a list of elements to carry about
  this.bag = [] // gets {element, x, y}
  // fuuu
  let writeTitleMatter = (div, def) => {
    let md = false
    div.onmouseover = () => {
      def.highlight()
      if (!md) document.body.style.cursor = 'grab'
    }
    div.onmouseout = () => {
      def.unhighlight()
      if (!md) document.body.style.cursor = 'auto'
    }
    div.onmousedown = (evt) => {
      md = true
      document.body.style.cursor = 'grabbing'
      // pin to current position,
      this.fix()
      evt.preventDefault()
      evt.stopPropagation()
      let domElemMouseMove = (evt) => {
        // TRANSFORMS here to move div about on drag
        evt.preventDefault()
        evt.stopPropagation()
        // need to find that top-level view's scale transform
        this.fx += evt.movementX / view.tls
        this.fy += evt.movementY / view.tls
        this.newFix()
        this.tick()
      }

      function rmOnMouseUp(evt) {
        md = false
        document.body.style.cursor = 'auto'
        document.removeEventListener('mousemove', domElemMouseMove)
        document.removeEventListener('mouseup', rmOnMouseUp)
      }

      document.addEventListener('mousemove', domElemMouseMove)
      document.addEventListener('mouseup', rmOnMouseUp)
    }
  }

  // -------------------------------------------- TAKE

  // take up new things
  this.typeset = []
  this.take = (div, def, stall, resize) => {
    let type = ''
    // cover view-containing ... ??
    // if ($(div).is('.native') && $(div).children().contains('.view'))
    let item = {
      type: '',
      de: div,
      def: def,
      offsetX: 0,
      offsetY: 0
    }
    // always nice to do this first,
    // defs -> the dom
    $(view.plane).append(item.de)
    // only a few cases we will allow,
    if ($(div).is('.inputs')) {
      item.type = 'inputs'
    } else if ($(div).is('.outputs')) {
      item.type = 'outputs'
    } else if ($(div).is('.defcore')) {
      item.type = 'core'
    } else if ($(div).is('.nativewrap')) {
      item.type = 'native'
      // at the gitgo, set this to our current width...
      // this width thing is happening because you're rewriting the
      // so ... not a take, a swap ? !!! FFUUUUU
      // native element's wrapper ...
      this.calculateSizes()
      if (this.w < 200) {
        $(item.de).css('width', `200px`)
      } else {
        $(item.de).css('width', `${this.w}px`)
      }
      // and for non-spec'd heights,
      if (item.de.clientHeight < 10) {
        $(item.de).css('height', '200px')
      }
      // ok then, resizeable also
      dt.makeResizeable(item.de, this.onElementResize, resize)
    } else if ($(div).is('.defbutton')) {
      item.type = 'button'
    } else {
      // best guess, but..
      item.type = 'core'
      console.error('no thx, no recognized type when taking div into floater')
    }
    // put it in the baaaag
    this.typeset.push(item.type)
    this.bag.push(item)
    // (also) write the drag content, if there's a header on board
    let header = $(div).children('.header').get(0)
    if (header) {
      writeTitleMatter(header, item.def)
    }
    // just want to do this once,
    if (stall !== true) this.onChange()
  } // end take

  this.fitNativeToFloater = () => {
    this.calculateSizes(true)
    // find it,
    let nt = this.bag.find((cnd) => {
      return cnd.type === 'native'
    })
    if (!nt) {
      console.error('not finding a native element to resize here')
    } else {
      $(nt.de).css('width', `${this.w}px`)
      // want also to reset the resizing handle ...
      // kind of messy call, but
      let w = nt.de.clientWidth
      let h = nt.de.clientHeight
      let handle = $(nt.de).children('.resizehandle').get(0)
      dt.writeTransform(handle, {
        x: w,
        y: h
      })
    }
  }

  // to catch,
  this.onElementResize = () => {
    // this is a lot,
    this.onChange()
    // our parent,
    view.kick()
  }

  // GROUP TYPES:
  // 'edges' ... (core) with (outputs) and .edges || (inputs)
  // 'unwrapped' ... (core) with (outputs) and .unwrapped || (inputs)
  // 'wrapped' ... (core) with (inputs) and (outputs) and (native .view) and .wrapped
  // 'std' ... (core) with some set of (inputs) and (outputs) and (native)

  this.makeEdges = () => {
    this.grouptype === 'edges'
    this.onChange()
  }

  // -------------------------------------------- CHANGE

  this.grouptype = grouptype
  // don't want to do this all the time
  // to 'open' ... put core with outputs,
  // to 'unwrap' ... put core with inputs, it will go below
  this.onChange = () => {
    // find types,
    let core = this.bag.find((cnd) => {
      return cnd.type === 'core'
    })
    let inputs = this.bag.find((cnd) => {
      return cnd.type === 'inputs'
    })
    let outputs = this.bag.find((cnd) => {
      return cnd.type === 'outputs'
    })
    let native = this.bag.find((cnd) => {
      return cnd.type === 'native'
    })
    // possible to have many,
    let buttons = []
    for (let item of this.bag) {
      if (item.type === 'button') buttons.push(item)
    }

    let spaces = 5

    // TYPE CASES BY TYPESET
    //console.log('FLT onchange, floater has', core ? '(core)' : '', inputs ? '(inputs)' : '', outputs ? '(outputs)' : '', native ? '(native)' : '')

    if (this.grouptype === 'std') {
      // 'std' ... (core) with some set of (inputs) and (outputs) and (native)
      core.offsetX = -core.de.clientWidth
      core.offsetY = 0
      if (inputs) {
        inputs.offsetX = core.offsetX - inputs.de.clientWidth - spaces - 2
        inputs.offsetY = 0
      }
      if (outputs) {
        outputs.offsetX = spaces
        outputs.offsetY = 0
      }
      if (native) {
        // calc sizes, ignoring native
        this.calculateSizes(true)
        native.offsetX = this.bb.x1
        native.offsetY = this.bb.y2 + spaces
        // for resizing,
        if (outputs) {
          let gap = native.de.clientWidth - this.w
          if (gap > 1) {
            outputs.offsetX += gap
          }
        }
      }
    } else if (this.grouptype === 'unwrapped') {
      // 'unwrapped' ... (core) with (outputs) and .unwrapped || (inputs)
      if (core) {
        // unwrapped, left side, core, outputs, etc
        core.offsetX = -core.de.clientWidth
        core.offsetY = 0
        if (outputs) {
          outputs.offsetX = spaces
          outputs.offsetY = 0
        }
        if (native) {
          this.calculateSizes(true)
          native.offsetX = this.bb.x1
          native.offsetY = this.bb.y2 + spaces
          if (outputs) {
            let gap = native.de.clientWidth - this.w
            if (gap > 1) {
              outputs.offsetX += gap
            }
          }
        }
      } else {
        // unwrapped, right side, it's the lonely inputs
        if (inputs) {
          inputs.offsetX = -inputs.de.clientWidth
          inputs.offsetY = 0
        }
      }
    } else if (this.grouptype === 'wrapped') {
      // should have 'em all let's just wyld out
      // the view attached is king,
      let ntw = native.de.clientWidth
      let nth = native.de.clientHeight
      // left ...
      native.offsetX = -core.de.clientWidth
      native.offsetY = core.de.clientHeight + spaces
      // core
      core.offsetX = -core.de.clientWidth
      core.offsetY = 0
      // inputs, well left
      inputs.offsetX = core.offsetX - inputs.de.clientWidth - spaces
      inputs.offsetY = $(inputs.de).children('.header').get(0).clientHeight + spaces + native.offsetY
      // ouputs, as is tradition
      outputs.offsetX = ntw + spaces + core.offsetX
      outputs.offsetY = inputs.offsetY
    } else if (this.grouptype === 'edges') {
      if(core && outputs){
        this.edgetype = 'left'
        // and on top of self,
        core.offsetX = -core.de.clientWidth
        core.offsetY = -core.de.clientHeight - 25
        outputs.offsetX = core.offsetX
        outputs.offsetY = core.offsetY - outputs.de.clientHeight - spaces
      } else {
        this.edgetype = 'right'
        inputs.offsetX = -inputs.de.clientWidth
        inputs.offsetY = -inputs.de.clientHeight - 25
        // aaand
        view.msgbox.setTopMargin( - inputs.offsetY + 20)
      }
    } else {
      console.error(`this floater grouptype not written or recognized: '${this.grouptype}'`)
    }

    // now we can cover buttons, using core offsets
    // cover buttons, if(buttons.length){
    if (buttons.length > 0) {
      if (!core) console.error('watch buttons not-on core?')
      let inc = 0
      for (let btn of buttons) {
        btn.offsetX = core.offsetX + inc
        btn.offsetY = -20 - core.offsetY
        inc += 20
      }
    }
    // ok,

    // now we can execute this,
    this.moveTo()
    // oy oy oy
  } // end onChange

  let writePosition = (element, x, y) => {
    $(element).css('left', `${x}px`).css('top', `${y}px`)
  }

  let readPosition = (element) => {
    let it = $(element)
    return {
      x: parseInt(it.css('left')),
      y: parseInt(it.css('top'))
    }
  }

  let readSize = (element) => {
    return {
      w: element.clientWidth,
      h: element.clientHeight
    }
  }

  this.moveTo = (x, y, backdoor) => {
    // but still probably want to check our offsets,
    if (this.isFixed && !backdoor) {
      this.x = this.fx
      this.y = this.fy
    }
    // to just draw new position, run with no args
    if (x === undefined) {
      x = this.x
      y = this.y
    } else {
      this.x = x
      this.y = y
    }
    // will return this ...
    let desire = {
      x: 0,
      y: 0
    }
    // check bounds,
    if(!view.isTopLevel){
      // bummer to do so many times !
      let bounds = view.getCurrentBounds()
      this.calculateSizes()
      //
      if(this.grouptype === 'edges'){
        //console.log('bounds', bounds)
        // x1, y1, x2, y2, w, h
        if(this.edgetype === 'left'){
          this.x = - this.bb.x1
          this.y = - this.bb.y1 + 17 + 5
        } else {
          this.x = bounds.x2 - this.bb.x2 - 2
          this.y = bounds.y1 - this.bb.y1 + 17 + 5
        }
      } else {
        //console.log('place bounds', this.bb)
        //console.log('bounds', bounds)
        // x needs to contend with offset,
        // this.bb.x1 probably -ve,
        // this.bb.y1 probably -ve,
        // want to track, but won't push things left or up,
        this.x = Math.max(bounds.x1 - this.bb.x1, this.x) // lower bounds
        this.y = Math.max(bounds.y1 - this.bb.y1, this.y)

        // want-right term,
        let rbnd = bounds.x2 - this.bb.x2
        if(this.x > rbnd){
          desire.x = this.x - rbnd
          this.x = rbnd
          // wants to go right
        }
        // want-down term,
        let lbnd = bounds.y2 - this.bb.y2
        if(this.y > lbnd){
          desire.y = this.y - lbnd
          this.y = lbnd
          // wants to go down
        }
      }
    }
    // do work
    writePosition(this.ownElement, x - 16.5, y - 20)
    for (let item of this.bag) {
      writePosition(item.de, this.x + item.offsetX, this.y + item.offsetY)
    }
    // aaaand tell em what we waaaaant
    return desire
  }

  this.newFix = () => {
    this.moveTo(this.fx, this.fy, true)
  }

  // as is tradition, we'll keep things local,
  // and just make sure we re-calculate during relevant events... ?
  this.calculateSizes = (nonNative) => {
    // from core of xy, values like
    //
    //   * -------------- (y1) -------- *
    //   |                 |            |
    //   |(x1) --------- (x,y) ---- (x2)|
    //   |                |             |
    //   |                |             |
    //   * ------------ (y2) ---------- *

    let x1 = 0
    let y1 = 0
    let x2 = 0
    let y2 = 0
    for (let item of this.bag) {
      // items are str8 cut dom elements,
      if (nonNative && item.type === 'native') continue
      let wt = readSize(item.de)
      // we know item offsets, so
      if (item.offsetX < x1) x1 = item.offsetX
      if (item.offsetY < y1) y1 = item.offsetY
      if (item.offsetX + wt.w > x2) x2 = item.offsetX + wt.w
      if (item.offsetY + wt.h > y2) y2 = item.offsetY + wt.h
      // corners
    }
    this.bb.x1 = x1
    this.bb.y1 = y1
    this.bb.x2 = x2
    this.bb.y2 = y2
    // ok,
    this.w = x2 - x1
    this.h = y2 - y1
    // also,
    this.r = Math.max(this.w, this.h) / 2
    // check,
    let aspect = this.w / this.h
    if (aspect > 8 || aspect < 0.125) {
      //console.error(`warning: deviously large aspect for 'circular' collisions: ${aspect}, logging floater`, this)
    }
  }

  this.tick = () => {
    // will use to bother the simulation
    view.tick()
  }

  this.free = () => {
    this.x = this.fx
    this.y = this.fy
    delete this.fx
    delete this.fy
    this.isFixed = false
    $(this.ownElement).html(`<i class="em em-pushpin"></i>`)
    this.tick()
  }

  this.fix = () => {
    $(this.ownElement).html(`<i class="em em-round_pushpin"></i>`)
    this.isFixed = true
    this.fx = this.x
    this.fy = this.y
    this.moveTo(this.fx, this.fy, true)
  }

  this.fixTo = (x, y) => {
    this.x = x
    this.y = y
    this.fix()
  }

  // RIP
  this.cleanup = () => {
    // js deletes things that are unreachable, so
    // there are a few objects that are on the canvas we want to get rid of
    $(this.ownElement).remove()
    // also, any handle added to a native element
    // not being able to search by js subset is kind of a bummer here, but
    let native = this.bag.find((cnd) => {
      return cnd.type === 'native'
    })
    if (native) {
      $(native.de).children('.resizehandle').remove()
    }
  }
  //
}

export default Floater
