/*
view/vdef.js

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// a def is not a hunk, it's a definition of a hunk - the mirror image

import {
  isIntType
} from '../typeset.js'

import Floater from './vfloater.js'

// new this -
function HunkDefinition(spec, view, dt, debug) {
  // the basics,
  this.ind = spec.ind
  this.name = spec.name
  this.type = spec.type
  this.inputs = new Array()
  this.outputs = new Array()
  this.states = new Array()
  // yep,
  this.parentView = view

  // dom elements group, containing (but not limited to)
  this.deg = {
    core: {}
  }
  this.isExploded = false
  this.floatGroupType = 'collected'

  // core ...
  this.deg.core = $('<div>').addClass('defcore').attr('id', `${this.name}_${this.ind}`).get(0)
  let title = $(`<div>${this.name}</div>`).addClass('deftitle').addClass('header').get(0)
  $(title).append($(`<span style="float:right">(${this.type})</span>`))

  $(this.deg.core).append(title)
  if (spec.states.length > 0) {
    let sdom = $('<div>').addClass('states')
    for (let st in spec.states) {
      let state = new StateDefinition(spec.states[st], st, this, view, debug)
      this.states.push(state)
      $(sdom).append(state.de)
    }
    $(this.deg.core).append(sdom)
  }

  // init our floater array, and startup with 0th entry (one floater per def == standard)
  this.floaters = []
  this.floaters.push(new Floater(view, 'std'))

  // write inputs
  if (spec.inputs.length > 0) {
    // idom, odom want title bars ...
    let idom = $('<div>').addClass('inputs')
    $(idom).append($(`<div>inputs >></div>`).addClass('inputheader').addClass('header'))
    for (let ip in spec.inputs) {
      let input = new InputDefinition(spec.inputs[ip], ip, this, debug)
      this.inputs.push(input)
      $(idom).append(input.de)
    }
    this.deg.inputs = $(idom).get(0)
    this.floaters[0].take(this.deg.inputs, this, true)
  }
  // write outputs,
  if (spec.outputs.length > 0) {
    let odom = $('<div>').addClass('outputs')
    $(odom).append($(`<div>>> outputs</div>`).addClass('outputheader').addClass('header'))
    for (let op in spec.outputs) {
      let output = new OutputDefinition(spec.outputs[op], op, this, view, dt, debug)
      this.outputs.push(output)
      $(odom).append(output.de)
    }
    this.deg.outputs = $(odom).get(0)
    this.floaters[0].take(this.deg.outputs, this, true)
  }

  // title right-click handler
  title.oncontextmenu = (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    // write menu for requesting delete and copy
    let menu = $('<div>').addClass('contextmenu').get(0)
    $(menu).append($('<li><i class="em em-coffin"></i> remove hunk</li>').on('click', (evt) => {
      view.requestRemoveHunk(this.ind)
      $(menu).remove()
    }))
    $(menu).append($('<li><i class="em em-abc"></i> rename hunk</li>').on('click', (evt) => {
      $(evt.target).text('')
      let tinput = $('<input>').attr('type', 'text').attr('size', 24).attr('value', 'new name').get(0)
      $(evt.target).append(tinput)
      $(tinput).focus()
      $(tinput).select()
      $(tinput).on('keyup', (evt) => {
        if (evt.keyCode == 13) {
          view.requestRenameHunk(this.ind, tinput.value).then((def) => {
            console.log('cleared new name for', def)
            $(menu).remove()
          })
        }
      })
    }))
    $(menu).append($('<li><i class="em em-repeat_one"></i> copy hunk</li>').on('click', (evt) => {
      // todo: maybe this should copy state and req it down?
      view.requestAddHunk(this.type)
      $(menu).remove()
    }))
    // place it,
    // title.offsetWidth is 400
    // de.style.left, de.style.top, de.clientWidth,
    let ct = dt.readTransform(this.deg.core)
    let mp = {
      s: 1,
      x: ct.x,
      y: ct.y - 31*3 - 10
    }
    if(this.containsButtons()) mp.y -= 25
    if(view.isTopLevel){
      // write it,
      $(menu).append($('<li><i class="em em-arrows_counterclockwise"></i> reload from source</li>').on('click', (evt) => {
        view.reloadHunk(this.ind, false)
      }))
      mp.y -= 31
    }
    dt.writeTransform(menu, mp)
    $(view.plane).append(menu)
  }

  // take the core, not stalling,
  this.floaters[0].take(this.deg.core, this, false)

  /* ---------------------------    ---------------------------- */
  /* ------------------------- PHYSICS ------------------------- */
  /* ---------------------------    ---------------------------- */

  this.highlight = () => {
    $(this.deg.core).find('.deftitle').css('background-color', '#969696')
    if (this.deg.inputs) $(this.deg.inputs).find('.inputheader').css('background-color', 'white').css('color', 'black')
    if (this.deg.outputs) $(this.deg.outputs).find('.outputheader').css('background-color', 'white').css('color', 'black')
    if (this.deg.native) $(this.deg.native).find('.nativeheader').css('background-color', 'white').css('color', 'black')
  }

  this.unhighlight = () => {
    $(this.deg.core).find('.deftitle').css('background-color', '#303030')
    if (this.deg.inputs) $(this.deg.inputs).find('.inputheader').css('background-color', 'red').css('color', 'white')
    if (this.deg.outputs) $(this.deg.outputs).find('.outputheader').css('background-color', 'blue').css('color', 'white')
    if (this.deg.native) $(this.deg.native).find('.nativeheader').css('background-color', 'green').css('color', 'white')
  }

  /* ---------------------------    ---------------------------- */
  /* ------------------------- UPDATES ------------------------- */
  /* ---------------------------    ---------------------------- */

  // UPDATE Index
  this.newInd = (ind) => {
    this.ind = ind
    // and those titles, and ids ...
    $(this.de).attr('id', `${this.name}_${this.ind}`)
    $(title).text(`${this.name}`)
    title.append($(`<span style="float:right">(${this.type})</span>`).get(0))
    for (let ip of this.inputs) {
      ip.onNewParentInfo()
    }
    for (let op of this.outputs) {
      op.onNewParentInfo()
    }
    for (let st of this.states) {
      st.onNewParentInfo()
    }
  }

  // UPDATE Name
  this.updateName = (newName) => {
    this.name = newName
    $(this.de).attr('id', `${this.name}_${this.ind}`)
    $(title).text(`${this.name}`)
    title.append($(`<span style="float:right">(${this.type})</span>`).get(0))
    for (let ip of this.inputs) {
      ip.onNewParentInfo()
    }
    for (let op of this.outputs) {
      op.onNewParentInfo()
    }
    for (let st of this.states) {
      st.onNewParentInfo()
    }
  }

  this.cleanup = () => {
    cleanButtons()
    cleanFloaters()
    for (let od in this.deg) {
      $(this.deg[od]).remove()
    }
  }

  let cleanFloaters = () => {
    for (let flt of this.floaters) {
      flt.cleanup()
    }
    this.floaters.length = 0
  }

  this.containsButtons = () => {
    for(let fl of this.floaters){
      for(let it of fl.bag){
        if(it.type === 'button') return true
      }
    }
    return false
  }

  let cleanButtons = () => {
    // sloppy! there is probably one in one of the cores,
    try {
      // max 5...
      for (let i = 0; i < 5; i++) {
        let bindex = this.floaters[0].bag.findIndex((cnd) => {
          return cnd.type === 'button'
        })
        if (bindex !== -1) {
          // also going to get that typeset issue ...
          // pls to god this is reworked before a bug resulting appears
          // rm from the dom,
          $(this.floaters[0].bag[bindex].de).remove()
          this.floaters[0].bag.splice(bindex, 1)
        } else {
          break
        }
      }
      // now we can
      this.floaters[0].onChange()
    } catch (err) {
      console.error(`couldn't clean buttons from ${this.name}, for reasons:`, err)
    }
  }

  /* ---------------------------    ---------------------------- */
  /* ----------------- RM/ADD/ECT to FLOATERS ------------------ */
  /* ---------------------------    ---------------------------- */

  this.collect = () => {
    // restore state, collect .deg under one hood (what of buttons?)
    console.error('not yet collecting')
  }

  this.unwrap = () => {
    // never twice
    if (this.floatGroupType === 'unwrapped') return
    // otherwise
    this.floatGroupType = 'unwrapped'
    // free willy
    // ok, can we just murder everything and start from scratch?
    // still have those .deg elements, so ...
    // will have to write a remove
    //console.log('UNWRAP')
    cleanFloaters()
    // (unrwapped) has a core with the core, outputs, and native
    let cflt = new Floater(view, 'unwrapped')
    if (this.deg.outputs) {
      cflt.take(this.deg.outputs, this, true)
    }
    if (this.deg.native) {
      if (this.type === 'view' && view) {
        //console.log('ommitting view deg from this def')
      } else {
        cflt.take(this.deg.native, this, true)
      }
    }
    cflt.take(this.deg.core, this)
    if (this.deg.native) {
      if (this.type === 'view' && view) {
        //console.log('ommitting view deg from this def')
      } else {
        cflt.fitNativeToFloater()
      }
    }
    this.floaters.push(cflt)
    // if there are inputs, they are separate
    if (this.deg.inputs) {
      let iflt = new Floater(view, 'unwrapped')
      iflt.take(this.deg.inputs, this)
      this.floaters.push(iflt)
    }
    // and kick that
    view.floop.reset()
  }

  // for links, accept a view domain element, add to ur floater, wrap that floater
  this.wrapon = (viewDef) => {
    // don't do it twice
    if (this.floatGroupType === 'wrappedon') return
    // set state
    this.floatGroupType = 'wrappedon'
    // errs when not a link,
    if (this.type !== 'link') throw new Error('non-links doth not wrap')
    // first stat, we want to keep this ref,
    this.reciprocalView = viewDef.hunk
    // ok, and we want viewdef objects to highlight ...
    // if we're not gathered to start, that's probably bad news
    if (this.floaters.length > 1) console.error('wyd here? many floaters during a wrap', this.floaters)
    // get the floater's bag-item containing that view ...
    let vflt = viewDef.floaters.find((cnd) => {
      return cnd.typeset.includes('native')
    })
    if (!vflt) throw new Error('could not find view floater on swap')
    //
    let vbagindex = vflt.bag.findIndex((cnd) => {
      return cnd.type === 'native'
    })
    if (vbagindex === -1) throw new Error('could not find floater native item on swap')
    let vbagitem = vflt.bag.splice(vbagindex, 1)[0]
    // before we do this, let's push out some extra space
    // this *is a hack*
    let bnds = view.getCurrentBounds()
    view.requestResize(1800, bnds.h + 600)
    // we need to make sure it's in the link's plane, jquery is smart about this,
    //console.log(view.plane, vbagitem.de)
    $(view.plane).append(vbagitem.de)
    // the link's 1st floater,
    let flt = this.floaters[0]
    flt.grouptype = 'wrapped'
    // flt.take au manuel
    flt.bag.push(vbagitem)
    flt.typeset.push('native')
    vbagitem.de.onResizeCustomCallback = flt.onElementResize
    // can just do recalc now?
    flt.onChange()
    // and also,
    vflt.onChange()
    // and *also*
    this.removeButton('<i class="em em-squid"></i>')
    this.addButton('<i class="em em-shell"></i>', (evt) => {
      console.error('no collapse yet')
    })
  }

  this.edgecase = () => {
    // check
    if (this.floatGroupType === 'edgecased') return
    // or set
    this.floatGroupType = 'edgecased'
    // also links only pls,
    if (this.type !== 'link') throw new Error('non-links doth not edge')
    // almost forgot, we want to get rid of this button:
    cleanButtons()
    // similar to the unwrap spec,
    // we're also assuming at this point that this view isn't wrapped around a view
    cleanFloaters()
    // now we want a left floater,
    // free willy
    let lflt = new Floater(view, 'edges')
    lflt.take(this.deg.core, this, true)
    lflt.take(this.deg.outputs, this, true)
    lflt.makeEdges()
    this.floaters.push(lflt)
    // and the right,
    let rflt = new Floater(view, 'edges')
    rflt.take(this.deg.inputs, this, true)
    rflt.makeEdges()
    this.floaters.push(rflt)
    // ok,
    view.floop.reset()
    // put inputs / outputs at edges of view body
    // put core below inputs, at left
    // make message box of the view sit low
    // handle view resizes ?
  }

  // adden em
  this.addButton = (text, callback) => {
    // write a button,
    let btn = $(`<div>${text}</div>`).addClass('defbutton').get(0)
    $(btn).on('click', callback).on('mouseover', (evt) => {
      document.body.style.cursor = 'pointer'
    }).on('mouseout', (evt) => [
      document.body.style.cursor = 'auto'
    ])
    // ok ok, then ...
    // we find the floater that contains the core,
    let coreFloater = this.floaters.find((cnd) => {
      return cnd.typeset.includes('core')
    })
    if (!coreFloater) throw new Error(`couldn't find a floater for this def button`, text)
    // attach the button element to its bag ...
    coreFloater.take(btn, this)
  }

  this.removeButton = (text, callback) => {
    // find the core-containing floater
    // we find the floater that contains the core,
    let coreFloater = this.floaters.find((cnd) => {
      return cnd.typeset.includes('core')
    })
    if (!coreFloater) throw new Error(`couldn't find a floater for this def button`, text)
    let success = false
    // au manuel splice outta the bag
    for (let item in coreFloater.bag) {
      let itm = coreFloater.bag[item]
      if (itm.type === 'button') {
        if ($(itm.de).html() === text) {
          // splice it out,
          coreFloater.bag.splice(item, 1)
          $(itm.de).remove()
          coreFloater.onChange()
          success = true
        }
      }
    }
    if (!success) console.error(`couldn't remove the button having text ${text}`)

  }

  // absorbing a native hunk's domain element,
  this.takeNative = (hunk) => {
    this.hunk = hunk
    // wants a wrapper,
    this.deg.native = $('<div>').addClass('nativewrap').get(0)
    // wrapper includes this title bar,
    $(this.deg.native).append($(`<div>${this.name}'s html element</div>`).addClass('nativeheader').addClass('header'))
    // and the hunk's element goes in that wrapper.
    $(this.deg.native).append(this.hunk.dom)
    // now we can hook it 2 a floater ... this will depend on our state, which we can mod later
    // atm, we'll put it with the core,
    let coreFloater = this.floaters.find((cnd) => {
      return cnd.typeset.includes('core')
    })
    if (!coreFloater) throw new Error(`couldn't find a floater for this def native`)
    // hook it
    coreFloater.take(this.deg.native, this, false, this.hunk.onresize)
    // has this handle,
    this.hunk.requestResize = (x, y) => {
      // set manual and call update,
      // doesn't matter which hunk this is in...
      // console.log(`REQRESIZE hunk ${this.name} requesting size of ${x}, ${y}`)
      // console.log('native', this.deg.native)
      this.deg.native.requestResize(x, y)
      view.tick()
    }
    // now we should be able to,
    this.hunk.onload()
  }

  // add special case buttons, just this so far
  if (this.type === 'link') {
    // todo:
    let expander = () => {
      this.addButton('<i class="em em-squid"></i>', (evt) => {
        // ???
        view.tlv.expandLink(this).then((view) => {
          console.log("EXPANDEEED --> expandLink promise completes", view)
        }).catch((err) =>{
          console.log("EXP catches err", err)
        })
      })
    }
    expander()
  }

  this.fixWithDataPort = () => {
    if(this.floaters[0].isFixed){
      // find the data port,
      let dp = view.tlv.trace(this.outputs[0])
      if(dp){
        dp.parent.floaters[0].fixTo(this.floaters[0].fx + 500, this.floaters[0].fy - 100)
      } else {
        console.error("no data port from trace")
      }
    } else {
      console.error("won't fix with data port: not fixed")
    }
  }

} // end def def

/* ---------------------------    ---------------------------- */
/* ------------------------ INPUT DEF ------------------------ */
/* ---------------------------    ---------------------------- */

function InputDefinition(ipspec, ind, def, debug) {
  // keep track of name and type,
  this.name = ipspec.name
  this.type = ipspec.type
  this.parent = def
  this.ind = parseInt(ind)
  // a dom element
  this.de = $(`<li>${this.name} (${this.type})</li>`).addClass('input').get(0)
  this.de.id = `${this.parent.name}_${this.parent.ind}_input_${this.name}`
  this.onNewParentInfo = () => {
    this.de.id = `${this.parent.name}_${this.parent.ind}_input_${this.name}`
  }
  // we also keep a list,
  this.connections = new Array()
  this.disconnect = (output) => {
    let index = this.connections.findIndex((cand) => {
      return (cand.parent.ind === output.parent.ind && cand.name === output.name && cand.type === output.type)
    })
    if (index === -1) throw new Error('during output disconnect, input cannot find output...')
    this.connections.splice(index, 1)
  }
  this.disconnectAll = () => {
    for (let op of this.connections) {
      op.disconnect(this)
    }
    this.connections.length = 0
  }
  // to get this object via the dom, circular... apparently that is fine ?
  this.de.hookup = this
}

/* ---------------------------    ---------------------------- */
/* ----------------------- OUTPUT DEF ------------------------ */
/* ---------------------------    ---------------------------- */

function OutputDefinition(opspec, ind, def, view, dt, debug) {
  // keep track of name and type,
  this.parent = def
  this.name = opspec.name
  this.type = opspec.type
  this.ind = parseInt(ind)
  // a dom element
  this.de = $(`<li>(${this.type}) ${this.name}</li>`).addClass('output').get(0)
  this.de.id = `${this.parent.name}_${this.parent.ind}_output_${this.name}`
  this.onNewParentInfo = () => {
    this.de.id = `${this.parent.name}_${this.parent.ind}_output_${this.name}`
  }
  // outputs handle all of the dragging-etc
  if (opspec.connections !== undefined) {
    this.specConnections = opspec.connections
  }
  this.connections = new Array() // of inputdefs, !
  this.connect = (inputdef) => {
    inputdef.connections.push(this)
    this.connections.push(inputdef)
  }
  this.disconnect = (inputdef) => {
    inputdef.disconnect(this)
    let iof = this.connections.findIndex((cand) => {
      return (cand.name === inputdef.name && cand.parent.ind === inputdef.parent.ind)
    })
    if (iof === -1) throw new Error('could not find input to disconnect')
    this.connections.splice(iof, 1)
    return true
  }
  this.disconnectAll = () => {
    for (let ip of this.connections) {
      ip.disconnect(this)
    }
    this.connections.length = 0
  }
  // the dragging
  this.floater = {}
  this.hasFloater = false
  // ondrag, attached later
  let evtDrag = (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    let pt = dt.readTransform(view.tlv.plane)
    let thet = dt.readTransform(this.floater)
    // ... set delta
    thet.x += evt.movementX / pt.s
    thet.y += evt.movementY / pt.s
    dt.writeTransform(this.floater, thet)
    view.drawLinks()
  }
  // to remove the below
  let dragMouseUp = (evt) => {
    if (debug) console.log('MOUSEUP ON', evt.target.id)
    // 1st, make sure it's an input
    if ($(evt.target).is('.input')) {
      // HERE: searcheth by input id text? or
      let hk = evt.target.hookup
      // hookups are hooks to the input's def-object
      // console.log('ah hookup looks like:', hk)
      if (!hk) throw new Error('missing some data at this input...')
      // use a dom data flag, to find that input and output id?
      // are we in the same context?
      if(hk.parent.parentView === this.parent.parentView){
        view.requestAddLink(this, hk)
      } else {
        console.warn("UI Route Builder Begins...")
        this.parent.parentView.tlv.buildRoute(this, hk).then(() => {
          console.warn("UI Route Builder Resolves !")
        })
      }
      // do things to conn, then
    }
    // cleanup
    document.removeEventListener('mouseup', dragMouseUp)
    document.removeEventListener('mousemove', evtDrag)
    // remove the floater flag
    this.hasFloater = false
    // remove the floater itself
    $(view.plane).find('#floater').remove()
    view.drawLinks()
  }
  // eeeeehntr for link-hookup-dragging
  this.de.onmousedown = (evt) => {
    evt.stopPropagation()
    evt.preventDefault()
    if (debug) console.log('mousedown for', this)
    // this and that flag will be read-in on drawlinks, to draw that link
    this.floater = $('<div>').attr('id', 'floater').append(this.type).get(0)
    this.hasFloater = true
    this.floater.style.zIndex = '1'
    // set initial position by the outputs' position,
    let dparent = $(this.de).parent().get(0)
    let opp = dt.readTransform(dparent)
    // top-level plane ...
    let pt = dt.readTransform(view.tlv.plane)
    // plonk: have to do this now or else clientHeight / width are 0
    view.plane.appendChild(this.floater)
    // init out floater position, and put it in the dom
    dt.writeTransform(this.floater, {
      s: 1,
      x: opp.x - ((this.floater.clientWidth + 5)),
      y: opp.y + this.floater.clientHeight * (this.ind + 0.5) // - ((fltheight * pt.s) / 2) / pt.s
    })
    // handlers to drag, and remove
    document.addEventListener('mousemove', evtDrag)
    // and delete / act when mouse comes up
    document.addEventListener('mouseup', dragMouseUp)
  }
}

/* ---------------------------    ---------------------------- */
/* ------------------------ STATE DEF ------------------------ */
/* ---------------------------    ---------------------------- */

function StateDefinition(stspec, ind, def, view, debug) {
  this.parent = def
  this.name = stspec.name
  this.type = stspec.type
  this.ind = parseInt(ind)
  // business,
  this.value = stspec.value
  // ok,
  this.de = $('<div>' + this.name + " (" + this.type + ")" + '</div>').addClass('stateItem').get(0)
  this.de.id = `${this.parent.name}_${this.parent.ind}_state_${this.name}`
  this.onNewParentInfo = () => {
    this.de.id = `${this.parent.name}_${this.parent.ind}_state_${this.name}`
  }
  // ui for these ... we can just cover the basics of js types because yonder serializations
  // etc will throw errors for other types. of course, this could help more, but we're in a rush
  switch (typeof this.value) {
    case 'string':
      //dom.append($('<br>').get(0))
      let strinput = $('<input>').attr('type', 'text').attr('size', 32).attr('value', this.value).css('width', '240px').get(0)
      strinput.addEventListener('change', (evt) => {
        // ask for a change,
        // TODO HERE NOW: this is the state change request you want to write
        // do it like writeMessage() instead
        // requestStateChange(def.id, state, strinput.value)
        // but assert that we don't change the definition unless
        view.requestStateChange(this, strinput.value)
        strinput.value = this.value
      })
      this.de.append(strinput)
      this.set = (value) => {
        if (typeof value === 'string') {
          strinput.value = value
          this.value = value
        } else {
          throw new Error('bad type put into state dom')
        }
      }
      break // end string types
    case 'number':
      let ninput = $('<input>').addClass('stateNumInput').attr('type', 'text').attr('size', 24).attr('value', this.value.toString()).css('width', '100px').get(0)
      ninput.addEventListener('change', (evt) => {
        // ask for a change, watch for float or for int ...
        if (isIntType(this.type)) {
          view.requestStateChange(this, parseInt(ninput.value))
        } else {
          view.requestStateChange(this, parseFloat(ninput.value))
        }
        // but assert that we don't change the definition unless
        ninput.value = this.value
      })
      this.de.append(ninput)
      this.set = (value) => {
        if (typeof value === 'number') {
          // quite sure js does this conversion no problem
          ninput.value = value
          this.value = value
        } else {
          throw new Error('bad type put into state dom')
        }
      }
      break // end numnber type
    case 'boolean':
      let span = $('<span style="float:right;">' + this.value.toString() + '</span>').get(0)
      $(this.de).addClass('stateBooleanItem')
      this.de.append(span)
      this.de.addEventListener('click', (evt) => {
        // read the current 'state' (as written) and send the opposite
        let txt = $(span).text()
        if (txt === 'true') {
          view.requestStateChange(this, false)
        } else {
          view.requestStateChange(this, true)
        }
      })
      this.set = (value) => {
        if (typeof value === 'boolean') {
          $(span).text(value.toString())
          this.value = value
        } else {
          throw new Error('bad type put into state dom')
        }
      }
      break // end boolean type
    default:
      console.error(`unaccounted for type at input pull for state change, ${typeof state.value}`)
      break
  }
}

export default HunkDefinition
