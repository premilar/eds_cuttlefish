/*
hunks/view.js

scope!

Jake Read at the Center for Bits and Atoms
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
} from './hunks.js'

import {
  TSET, // typset
  MK, // manager keys,
  HK, // hunk keys,
  MSGS, // messaging
  isIntType,
  isFloatType,
  isNumType
} from '../typeset.js'

// yonder def, the ui mirror on hunks
import HunkDefinition from '../view/vdef.js'

// to file-organize view.js, a monster
import DomTools from '../view/vdom.js'
import BezierTools from '../view/vbzt.js'
import MessageBox from '../view/vmsg.js'
import PatchSet from '../view/vptch.js'

// the force loop
import Floop from '../view/vfloop.js'

function View() {
  Hunkify(this)

  let verbose = false
  let msgverbose = false

  let msgsin = new Input('byteArray', 'msgs', this)
  let msgsout = new Output('byteArray', 'msgs', this)

  this.inputs.push(msgsin)
  this.outputs.push(msgsout)

  // das UI globals
  // our dom is the space we're allotted,
  this.dom = {}
  // the plane, one layer beneath, is where divs live
  this.plane = {}

  // we have a list of definitions,
  let defs = new Array()
  // #ref, sloppy
  this.defs = defs

  // tools to write dom-representations of hunks,
  let dt = new DomTools(this)
  // a handy box, for stuff
  let msgbox = new MessageBox(this)
  this.msgbox = msgbox
  this.interpreterName = null
  this.interpreterVersion = null
  // and tools for the links,
  let bzt = new BezierTools(this)
  // and for program (patch) management
  let patchset = new PatchSet(this, msgbox)
  this.patchset = patchset

  // here ... at this point,
  /*
  an init order, etc, for each view to have top-level access ...
  for tls stuff
  for contextmenu , do (tlv.oncontext(this, event))
  ... aaaand ?
  */
  // the toplevel view,
  this.tls = 1
  // this is one of the biggest outstanding issues w/ this whole thing:
  // views have child issues
  this.tlv = this

  /* ---------------------------    ---------------------------- */
  /* -------------------- INIT, LISTENERS ---------------------- */
  /* ---------------------------    ---------------------------- */

  // oddity, init happens when loaded into the runtime
  // onload when we have a dom element
  // these are separate events due to cuttlefish implementation, sawry
  this.init = () => {
    // in the case of UIs, we have the dom before init runs,
    // so this is kind of like the 'window.onload' function
    // but we do need to write our dom object to start,
    // then cf will drop it wherever we plan ...
    console.log(`INIT for ${this.name}`)
    this.dom = $('<div>').addClass('view').get(0)
    this.dom.hunk = this
  }
  // END INIT CODE

  // onload is called in vdef.js ~ L350
  this.onload = () => {
    console.log(`ONLOAD for ${this.name}`)
    // for nested dom elements,
    this.plane = $('<div>').addClass('plane').get(0)
    // this needs to start with some transform ..
    dt.writeTransform(this.plane, {
      x: 0,
      y: 0,
      s: 1
    })
    // append
    $(this.dom).append(this.plane)
    // more space
    this.requestResize(1100, 500)
  }

  // we also have events that a level above us can fire...
  this.onresize = () => {
    // don't think too hard, do
    this.kick()
    // console.error('onresize: need to move things about, probably')
    // this.drawLinks()
  }

  // dummy, will b replaced
  this.requestResize = (x, y) => {
    let bounds = this.getCurrentBounds()
    if (x < bounds.w && y < bounds.h) {
      // it's fine
    } else {
      console.warn('requestResize not yet implemented by parent')
    }
  }

  this.requestSizeIncrease = (x, y) => {
    //console.log('req', x, y)
    let bounds = this.getCurrentBounds()
    this.requestResize(bounds.w + x, bounds.h + y)
  }

  // here bc related to resizing, sizes
  // this is re-written during .makeTopLevel
  this.getCurrentBounds = () => {
    // more like
    let x1 = 0
    let y1 = 0
    let x2 = this.dom.clientWidth
    let y2 = this.dom.clientHeight
    // console.log(`bounds: ${this.name}: ${w}, ${h}`, this.dom)
    return {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      w: x2 - x1,
      h: y2 - y1
    }
  }

  this.isTopLevel = false
  // the top level view, gifted to this hunk by omniscience

  /* ---------------------------    ---------------------------- */
  /* ------------------- END MAKETOPLEVEL ---------------------- */
  /* ---------------------------    ---------------------------- */

  /* ---------------------------    ---------------------------- */
  /* ----------------------- REDRAWING ------------------------- */
  /* ---------------------------    ---------------------------- */

  this.floop = new Floop(this)

  this.drawLinks = () => {
    // drawing from scratch every time ! could be faster, probably
    bzt.clear(this.plane)
    // 1st,
    //this.followRules()
    // draw 'em all
    for (let def of defs) {
      for (let output of def.outputs) {
        for (let input of output.connections) {
          bzt.drawLink(output, input)
        }
        if (output.hasFloater) {
          let head = bzt.getRightHandle(output.de)
          let tail = bzt.getFloaterHandle(output.floater)
          bzt.writeBezier(head, tail)
        }
      }
    }
  }

  // kick: topology changes
  this.kick = () => {
    //msgbox.checkHeight()
    this.floop.reset()
    this.drawLinks()
  }

  // tick: size / position changes
  this.tick = () => {
    this.floop.tick()
  }

  /* ---------------------------    ---------------------------- */
  /* ------------------- SERIAL -> HOTMESSES ------------------- */
  /* ---------------------------    ---------------------------- */

  let deserializeNameType = (arr, bytes, i) => {
    let nameresp = MSGS.readFrom(bytes, i, 'string')
    let typeresp = MSGS.readFrom(bytes, i + nameresp.increment, 'string')
    arr.push({
      name: nameresp.item,
      type: typeresp.item
    })
    return nameresp.increment + typeresp.increment
  }

  let specBySerial = (bytes, start, debug) => {
    // deserialize
    let spec = {
      ind: null,
      name: null,
      type: null
    }
    // inputs, outputs, state
    spec.inputs = new Array()
    spec.outputs = new Array()
    spec.states = new Array()
    // hold,
    let temp
    // starting at 2, msgs[0] is 'hnkalive'
    let i = start
    // lets write a goddang real structure an object (spec) with mirror type dom and access fn's ...
    // this will make building better and better code mucho bueno
    // ripperoni,
    try {
      outer: while (i < bytes.length) {
        switch (bytes[i]) {
          case HK.IND:
            i += 1
            temp = MSGS.readFrom(bytes, i, 'uint16')
            spec.ind = temp.item
            i += temp.increment
            break
          case HK.TYPE:
            i += 1
            temp = MSGS.readFrom(bytes, i, 'string')
            spec.type = temp.item
            i += temp.increment
            break
          case HK.NAME:
            i += 1
            temp = MSGS.readFrom(bytes, i, 'string')
            spec.name = temp.item
            i += temp.increment
            break
          case HK.INPUT:
            i += 1
            // expecting two strings here, name and then type
            i += deserializeNameType(spec.inputs, bytes, i)
            break
          case HK.OUTPUT:
            i += 1
            i += deserializeNameType(spec.outputs, bytes, i)
            if (bytes[i] === HK.CONNECTIONS) {
              let cn = 0
              i++
              spec.outputs[spec.outputs.length - 1].connections = []
              //console.log("HK B4 CONN")
              while (bytes[i] === HK.CONNECTION) {
                //console.log("HK CONNECTION");
                let frdarr = bytes.slice(i + 1, i + 3)
                //console.log("HK bytes for inHunkIndice", frdarr)
                let fbtarr = Uint8Array.from(frdarr)
                let fvlarr = new Uint16Array(fbtarr.buffer)
                i += 2
                spec.outputs[spec.outputs.length - 1].connections[cn] = [fvlarr[0], bytes[i + 1]]
                i += 2
              }
            }
            break
          case HK.STATE:
            i += 1
            i += deserializeNameType(spec.states, bytes, i)
            // ok, and the value should trail
            // we don't *need* to know the type, could just read by the key, but,
            //console.log(`${this.name} STATE READ from ${i}`, bytes[i], bytes);
            temp = MSGS.readFrom(bytes, i, spec.states[spec.states.length - 1].type)
            //console.log(`${this.name} TEMP`, temp);
            spec.states[spec.states.length - 1].value = temp.item
            i += temp.increment
            break
          default:
            console.log('spec so far', spec)
            console.log('bytes', bytes)
            throw new Error(`unexpected key encountered during hunk deserialization at position ${i}: ${bytes[i]}`)
            break outer
        }
      }
    }
    catch (err) {
      console.warn("caught in try/catch:")
      console.error(err)
      console.log('spec so far', spec)
      console.log('bytes', bytes)
      throw new Error("halt")
    }
    // a check,
    if (debug) console.log(`broke outer, len at ${bytes.length}, i at ${i}`)
    // we should be able to kind of pick-thru and append based on,
    if (debug) console.log('spec apres deserialize', spec, 'from bytes', bytes)
    // we gucc ?
    if (spec.name == null || spec.type == null) {
      throw new Error('null spec, wyd?')
    }
    return spec
  }

  /* ---------------------------    ---------------------------- */
  /* -------------------- DEFS in the DOM ---------------------- */
  /* ---------------------------    ---------------------------- */

  let newDef = (spec) => {
    // hmmm ok, we have checked that this is new, not an update,
    if (verbose) console.log('ready write new spec to def', spec)
    // writing the hunk definition auto-drops it into this.plane ...
    let def = new HunkDefinition(spec, this, dt, false)
    defs.push(def)
    // got 'em, and writing it sets it into the dom, at 0,0
    // now let's see if there is any 'native' content
    // we can only do this in a top level view,
    let native, ni
    if (this.isTopLevel) {
      ni = cuttlefishHunkRef.findIndex((hunk) => {
        return hunk.ind === def.ind
      })
      native = cuttlefishHunkRef[ni]
      if (native && def.name !== 'tlview') {
        try { // try to add the dom element to the def's domelement
          // native is a handle on the hunk itself,
          //console.log('def', def)
          def.takeNative(native)
          // clear from the other list,
          cuttlefishHunkRef.splice(ni, 1)
          // if it's a child,
          if (native.type === 'view' && this.name === 'tlview') {
            native.tlv = this
          }
          console.log(`VW ${this.name} wrote a native hunk into the dom for ${def.name}`)
          //msgbox.write(`wrote a native hunk into the dom:  ${def.name}`)
        } catch (err) {
          console.log(err)
          //msgbox.write(`native hunk attach fails ${err}`)
        }
      }
    }
    // ok, we have the def, now we need to (1) place it and also (2)
    // hook it up to any native dom elements (cuttlefish only)
    // we'll find the menu, if it's about, this is a nice place to place
    let mt = this.tlv.getPositionForPlacement(this)
    // we want to make sure that's in-bounds ...
    let bounds = this.getCurrentBounds()
    // console.log('bounds', bounds)
    // console.log(`view ${this.name} adding ${def.name}, bounds`, this.getCurrentBounds())
    if (!mt) {
      // todo: put this somewhere on-screen ?
      // but if no menu is up, likely a load from patch
      mt = {}
      mt.x = Math.random() * bounds.w - 100
      mt.y = Math.random() * bounds.h - 100
      def.floaters[0].moveTo(mt.x, mt.y)
    } else {
      if (mt.x > bounds.w) mt.x = bounds.w - 100
      if (mt.y > bounds.h) mt.y = bounds.h - 100
      def.floaters[0].fixTo(mt.x, mt.y)
    }
    // kick does mucho stuff, mostly incl. restarting the sim
    this.kick()
    // ...
    return def
  } // FIN NEWDEF

  let updateDef = (spec) => {
    // console.error('updateDef probably error-filled after floop (?)')
    // update should change names, values, but not types or orders
    // with an update, we maintain link topology
    // with a replace, we wipe link topology,
    // and manager is responsible for updating us with new links
    console.log('updateDef with this spec:', spec)
    let cdef = defs[spec.ind]
    // check name,
    if (spec.name !== cdef.name) {
      cdef.updateName(spec.name)
    }
    // check states,
    for (let st in spec.states) {
      if (spec.states[st].value !== cdef.states[st].value) {
        cdef.states[st].set(spec.states[st].value)
      }
    }
  } // end update

  let replaceDef = (spec) => {
    console.warn(`REPLACE DEF at ${spec.ind} in ${this.name} has name ${spec.name}`)
    let od = defs[spec.ind]
    // as a rule, when we replace defs, we unhook everything.
    // the manager is responsible for following up by sending us
    // links that are still alive,
    // console.log('the od', od)
    // so first rm those links (this won't properly be tested until program loading, i'd bet)
    for (let ip in od.inputs) {
      od.inputs[ip].disconnectAll()
    }
    for (let op in od.outputs) {
      od.outputs[op].disconnectAll()
    }
    // now we can pull any state out that we'd like, i.e.
    let oldFloatGroupType = od.floatGroupType
    // probably want this special case,
    let nt
    if (oldFloatGroupType === 'wrappedon') {
      // get it ...
      nt = od.floaters[0].bag.find((cnd) => {
        return cnd.type === 'native'
      })
      if (!nt) throw new Error("couldn't grab wrapped item during def replace")
    }
    let oldFloatPositions = []
    for (let flt of od.floaters) {
      oldFloatPositions.push({
        x: flt.x,
        y: flt.y,
        isFixed: flt.isFixed
      })
    }
    // now the rm,
    od.cleanup()
    delete defs[spec.ind]
    // and replace it,
    let nd = new HunkDefinition(spec, this, dt, false)
    // write-over and cut all connections, we'll receive new ones
    // ok, ready to place and append,
    if (oldFloatGroupType === 'unwrapped') {
      nd.unwrap()
    } else if (oldFloatGroupType === 'wrappedon') {
      // ok, so, a likely-bugs-forward au-manuel implementation,
      nd.floatGroupType = 'wrappedon'
      nd.reciprocalView = $(nt.de).find('.view').get(0).hunk
      // oh god, look away !
      // this works, but doesn't retain the resizing element, soooo
      nd.floaters[0].grouptype = 'wrapped'
      nd.floaters[0].bag.push(nt)
      nd.floaters[0].typeset.push('native')
      dt.makeResizeable(nt.de, nd.floaters[0].onElementResize, nd.reciprocalView.onresize)
      nd.floaters[0].onChange()
    } else if (oldFloatGroupType === 'edgecased') {
      nd.edgecase()
    }
    // and reset the positions
    for (let ps in oldFloatPositions) {
      let pos = oldFloatPositions[ps]
      let odf = nd.floaters[ps]
      if (odf && pos) {
        if (pos.isFixed) {
          odf.fixTo(pos.x, pos.y)
        } else {
          odf.moveTo(pos.x, pos.y)
        }
      }
    }
    // and replace it in the list,
    defs[spec.ind] = nd
    // and re-render
    this.kick()
    // occasionally useful,
    return nd
  }

  /* ---------------------------    ---------------------------- */
  /* ------------------ NATIVE HUNK MANAGEMENT ----------------- */
  /* ---------------------------    ---------------------------- */

  // for cuttlefish hunks, with dom elements ...
  let cuttlefishHunkRef = new Array()

  this.take = (hunk) => {
    cuttlefishHunkRef.push(hunk)
  }

  /* ---------------------------    ---------------------------- */
  /* ---------------------- REMOVE DEFS ------------------------ */
  /* ---------------------------    ---------------------------- */

  let removeDef = (index) => {
    // console.log('removeDef, also many floop likely errors')
    // ok ok ok
    let od = defs[index]
    if (od === undefined) throw new Error('no hunk to delete!')
    // else,
    for (let ip in od.inputs) {
      od.inputs[ip].disconnectAll()
    }
    for (let op in od.outputs) {
      od.outputs[op].disconnectAll()
    }
    // ok ...
    defs.splice(index, 1)
    // ordering
    onDefReorder()
    // and x2thegrave
    od.cleanup()
  }

  let onDefReorder = () => {
    for (let ind in defs) {
      if (defs[ind].ind !== parseInt(ind)) {
        // console.log(`swapping ${defs[ind].ind} for ${parseInt(ind)}`)
        defs[ind].newInd(parseInt(ind))
      }
    }
  }

  /* ---------------------------    ---------------------------- */
  /* ------------------- PUT AND CUT LINKS --------------------- */
  /* ---------------------------    ---------------------------- */

  let putLink = (outInd, outputInd, inInd, inputInd) => {
    try {
      let outputdef = defs[outInd].outputs[outputInd]
      let inputdef = defs[inInd].inputs[inputInd]
      outputdef.connect(inputdef)
      this.kick()
    } catch (err) {
      console.error('ERR at putlink', err)
      //msgbox.write('ERR at putlink: ' + err)
      console.log(`outInd ${outInd}, outputInd ${outputInd}, inInd ${inInd}, inputInd ${inputInd}`)
      console.log(`from ${this.name} having manager ${this.interpreterName}`)
      return false
    }
    return true
  }

  let cutLink = (outInd, outputInd, inInd, inputInd) => {
    try {
      let outputdef = defs[outInd].outputs[outputInd]
      let inputdef = defs[inInd].inputs[inputInd]
      //console.log('dc', performance.now())
      //console.log('to disconn', outputdef, 'from', inputdef)
      outputdef.disconnect(inputdef)
      this.kick()
      return true
    } catch (err) {
      //console.log('ERR at rmlink', err)
      //msgbox.write('ERR at rmlink' + err)
      return false
    }
    return false
  }

  /* ---------------------------    ---------------------------- */
  /* ----------------- HOTMESSES -> SERIALMSGS ----------------- */
  /* ---------------------------    ---------------------------- */

  // herein lay each of our unit requests, as promises,

  // hello is a ping,
  this.sayHelloToManager = () => {
    return new Promise((resolve, reject) => {
      let helloTime = performance.now()
      //msgbox.write(`said hello to manager at ${helloTime}ms`)
      promiseThis([MK.HELLO], () => {
        //msgbox.write(`manager says hello, took ${performance.now() - helloTime}ms`)
        console.log(`hello from ${this.name}`)
        resolve(performance.now() - helloTime)
      }, (errmsg) => {
        reject(errmsg)
      })
    })
  }

  // we can ask for top-level descriptions, or hunks descriptions (by index)
  this.queryManager = (ind) => {
    return new Promise((resolve, reject) => {
      if (ind !== undefined) {
        //msgbox.write(`querying manager for hunk at ${ind}`)
        let req = [MK.QUERY]
        MSGS.writeTo(req, ind, 'uint16')
        promiseThis(req, (def) => {
          resolve(def)
        }, (errmsg) => {
          reject(errmsg)
        })
      } else {
        //msgbox.write(`querying top level of manager`)
        promiseThis([MK.QUERY], (brief) => {
          //msgbox.write(`manager has ${brief.numHunks} hunks`)
          resolve(brief)
        }, (errmsg) => {
          reject(errmsg)
        })
      }
    })
  }

  // we can ask for a list of available new-stuff to add,
  this.requestListAvail = (prefix) => {
    // todo: where prefix is like dir/subdir/etc .. to heirarchy dive
    if (prefix) console.error('list query with prefixes not written...')
    return new Promise((resolve, reject) => {
      promiseThis([MK.REQLISTAVAIL], (list) => {
        resolve(list)
      }, (errmsg) => {
        reject(errmsg)
      })
    })
  }

  // ask to add one,
  this.requestAddHunk = (type, name, states) => {
    //console.log('type, states, name', type, states, name)
    return new Promise((resolve, reject) => {
      let msg = [MK.REQADDHUNK]
      MSGS.writeTo(msg, type, 'string')
      // when requesting a hunk with state option,
      // we just throw down (similar to descriptions) a list of
      // names, types, values ...
      // these will not always be used, but this is an
      // exercise in consistency at the moment
      // in an array
      // if its named,
      if (name) {
        msg.push(HK.NAME)
        MSGS.writeTo(msg, name, 'string')
      }
      if (states) {
        for (let st of states) {
          msg.push(HK.STATE)
          // later, of course, you have discovered that you don't need the 2nd string here...
          let msgbegin = msg.length
          MSGS.writeTo(msg, st.name, 'string')
          MSGS.writeTo(msg, st.type, 'string')
          MSGS.writeTo(msg, st.value, st.type)
          /*
          if (this.interpreterName === "ponyo" && type === "link") {
            console.log(`STATE SER FOR: ${st.value} into ${name}`)
            console.log(msg.slice(msgbegin))
          }
          */
        }
      }
      promiseThis(msg, (def) => {
        resolve(def)
      }, (errmsg) => {
        console.error('error while adding hunk', errmsg)
        reject(errmsg)
      })
    })
  }

  // to name them
  this.requestRenameHunk = (ind, name) => {
    return new Promise((resolve, reject) => {
      let msg = [MK.REQNAMECHANGE]
      MSGS.writeTo(msg, ind, 'uint16')
      MSGS.writeTo(msg, name, 'string')
      promiseThis(msg, (def) => {
        resolve(def)
      }, (errmsg) => {
        reject(errmsg)
      })
    })
  }

  // to change their state
  this.requestStateChange = (state, value) => {
    return new Promise((resolve, reject) => {
      let msg = [MK.REQSTATECHANGE]
      MSGS.writeTo(msg, state.parent.ind, 'uint16')
      MSGS.writeTo(msg, state.ind, 'uint8')
      try {
        MSGS.writeTo(msg, value, state.type)
      } catch (err) {
        reject(err)
        console.log('that type err:', err)
        //msgbox.write('err serializing state change request, see console for that type err')
      }
      promiseThis(msg, (stdef) => {
        //console.log('promise returns for state change for def', stdef)
        resolve(stdef)
      }, (errmsg) => {
        //console.log('promise rejects for state change bc error', errmsg)
        reject(errmsg)
      })
    })
  }

  // or remove them,
  this.requestRemoveHunk = (ind) => {
    return new Promise((resolve, reject) => {
      let msg = [MK.REQRMHUNK]
      MSGS.writeTo(msg, ind, 'uint16')
      promiseThis(msg, (rmid) => {
        resolve(rmid)
      }, (errmsg) => {
        console.error('error while removing hunk', errmsg)
        reject(errmsg)
      })
    })
  }

  // and we can add links
  this.requestAddLink = (output, input) => {
    return this.requestAddLinkLikeACaveman(output.parent.ind, output.ind, input.parent.ind, input.ind)
  }

  this.requestAddLinkLikeACaveman = (outInd, outputInd, inInd, inputInd) => {
    return new Promise((resolve, reject) => {
      let msg = [MK.REQADDLINK]
      MSGS.writeTo(msg, outInd, 'uint16')
      MSGS.writeTo(msg, outputInd, 'uint8')
      MSGS.writeTo(msg, inInd, 'uint16')
      MSGS.writeTo(msg, inputInd, 'uint8')
      promiseThis(msg, (link) => {
        resolve(link)
      }, (errmsg) => {
        reject(errmsg)
      })
    })
  }

  // or remove them
  this.requestRemoveLink = (output, input) => {
    return new Promise((resolve, reject) => {
      let msg = [MK.REQRMLINK]
      MSGS.writeTo(msg, output.parent.ind, 'uint16')
      MSGS.writeTo(msg, output.ind, 'uint8')
      MSGS.writeTo(msg, input.parent.ind, 'uint16')
      MSGS.writeTo(msg, input.ind, 'uint8')
      promiseThis(msg, (link) => {
        resolve(link)
      }, (errmsg) => {
        reject(errmsg)
      })
    })
  }

  /* ---------------------------    ---------------------------- */
  /* ------------------------ RECEPIES ------------------------- */
  /* ---------------------------    ---------------------------- */

  // with recepies, we take the atomic units above and do larger order operations

  this.refresh = () => {
    return new Promise((resolve, reject) => {
      // wipe ya docs, and ask yonder manager for a complete description
      // everything is friggen jquery, so check it out
      console.log("REFRESHING THE VIEW")
      //msgbox.clear()
      //msgbox.write('setting up to refresh the view')
      for (let def of defs) {
        def.cleanup()
      }
      // also,
      defs.length = 0
      // since this occasionally takes time, complete the wipe:
      this.kick()
      // hello first,
      this.sayHelloToManager().then(() => {
        this.queryManager().then((brief) => {
          // console.log('BRIEF', brief)
          //this.msgbox.briefState.setFromBrief(brief)
          // should have a list then, do that brief then ?
          let nh = brief.numHunks
          // the repeater / promise walker
          let cbnh = (n) => {
            this.queryManager(n).then((def) => {
              n++
              if (n < nh) {
                // case not-complete, so continue
                //msgbox.write(`caught ${n}th hunk, continuing...`)
                cbnh(n)
              } else {
                // now that we have it all, we can read in the
                // yikes w/r/t this tree
                for (let df in defs) {
                  let def = defs[df]
                  for (let op in def.outputs) {
                    let otp = def.outputs[op]
                    if (otp.specConnections) {
                      for (let sc of otp.specConnections) {
                        try {
                          putLink(df, op, sc[0], sc[1])
                        } catch (err) {
                          console.error('cannot reconnect from spec', err)
                          //msgbox.write(`err while trying to make links from spec`)
                        }
                      }
                      delete op.specConnections
                    }
                  }
                }
                // finally
                //msgbox.write(`~ view refresh complete ~`)
                this.hasRefreshed = true
                this.tlv.globalOrganize()
                resolve(this)
              }
            }).catch((err) => {
              console.error(err)
              //msgbox.write(`trouble while requesting ${n}th hunk`)
              reject(err)
            })
          }
          // the kickoff,
          cbnh(0)
        })
      })
    })
  }

  this.reloadHunk = (indice, restoreState) => {
    // reloads from source (devtool) if restoreState is set,
    // ... not going to write the version of this that restores state
    // we ask for state on the reset
    let od = this.defs[indice]
    let odx = od.floaters[0].x
    let ody = od.floaters[0].y
    // this in conjunction with error catching during the addhunk step ...
    // we can wrap all of this up in try / catch ? and delete things only when
    // those all pass ??
    // first, let's add in the new hunk:
    this.requestAddHunk(od.type).then((def) => {
      // let's compare these ? for matching inputs, outputs, reconnect:
      let matching = (odp, ndp, ind) => {
        if (odp[ind]) {
          if (odp[ind].name === ndp[ind].name && odp[ind].type === ndp[ind].type) return true
        } else {
          return false
        }
      }
      // these links are all added on a promise, meaning we aren't sure (by the time this runs to completion)
      // whether or not they are successful...
      // with better view -> manager integration, this would be mucho easier
      for (let ip in def.inputs) {
        if (matching(od.inputs, def.inputs, ip)) {
          for (let cn of od.inputs[ip].connections) {
            this.requestAddLink(cn, def.inputs[ip])
          }
        }
      }
      for (let op in def.outputs) {
        if (matching(od.outputs, def.outputs, op)) {
          for (let cn of od.outputs[op].connections) {
            this.requestAddLink(def.outputs[op], cn)
          }
        }
      }
      // we should wait for everything all async like, but
      this.requestRemoveHunk(od.ind).then(() => {
        $(this.dom).find('.contextmenu').fadeOut(400, function() {
          $(this).remove()
        })
        // and also,
        def.floaters[0].fixTo(odx, ody)
      })
    }).catch((err) => {
      this.changeContextTitle('error on reload, see consoles')
      setTimeout(() => {
        $(this.dom).find('.contextmenu').fadeOut(400, function() {
          $(this).remove()
        })
      }, 2000)
      console.error('caught request add hunk error from reload site')
    })
    // let's load one in w/ the changes ... if we can do this we'll go thru the rest

  }

  /* ---------------------------    ---------------------------- */
  /* --------------------- MESSAGES OUTPUT --------------------- */
  /* ---------------------------    ---------------------------- */

  let outmsgbuffer = new Array()

  let writeMessage = (bytes) => {
    if (!msgsout.io() && outmsgbuffer.length < 1) {
      // str8 shooters
      if (msgverbose) this.log('msg out', bytes)
      msgsout.put(bytes)
    } else {
      // gotta buffer
      outmsgbuffer.push(bytes)
      this.log('VIEW OUTBUFFER LEN', outmsgbuffer.length)
    }
  }

  // it's often very useful tracking completion, so
  let callbackSets = new Array()
  let cbid = 0

  let promiseThis = (bytes, callback, errback) => {
    cbid++
    if (cbid > 254) {
      cbid = 0
    } // could be safe about this, for now we take for granted less than 255 out,
    // remember it
    callbackSets.push({
      key: bytes[0],
      id: cbid,
      callback: callback,
      errback: errback
    })
    // so our header is like - we don't explicitly type the id, it's a byte
    let head = [MK.MSGID, cbid]
    // and we concat this to
    bytes = head.concat(bytes)
    writeMessage(bytes)
  }

  /* ---------------------------    ---------------------------- */
  /* ------------------ MESSAGES INPUT, LOOP ------------------- */
  /* ---------------------------    ---------------------------- */

  // still looking for clear function naming / message naming

  this.loop = () => {
    // THE Q: is it trees or is it inputs / outputs ? ports ...
    if (msgsin.io()) {
      let msg = msgsin.get()
      if (msgverbose) console.log('VIEW RX MSG:', msg)
      if (!Array.isArray(msg)) throw new Error(`view throwing object message, having header ${msg.header}`)
      // ... mirror for views
      let temp
      let inc = 0
      // track the msg id response, and that callback
      let msgid, cbd
      // find the element, set to cbd ref and delete from array
      if (msg[0] === MK.MSGID) {
        msgid = msg[1]
        inc = 2
        // and find the callback we registered
        let cbdi = callbackSets.findIndex((cand) => {
          return cand.id === msgid
        })
        if (cbdi !== -1) {
          cbd = callbackSets[cbdi]
          callbackSets.splice(cbdi, 1)
        }
      }
      // if a msgid, find the callback
      // ok, get the id and increment ...
      switch (msg[inc]) {
        case MK.ERR:
          if (msgverbose) console.log('VIEW MSG is an error')
          let errmsg = MSGS.readFrom(msg, inc + 1, 'string').item
          console.error('manager returns an error', errmsg)
          //msgbox.write(errmsg)
          if (cbd) cbd.errback(errmsg)
          break
        case MK.HELLO:
          if (msgverbose) console.log('VIEW MSG is hello')
          if (cbd) {
            cbd.callback()
          } else {
            console.log(`manager says hello!`)
            //msgbox.write(`manager says hello!`)
          }
          break
        case MK.BRIEF:
          if (msgverbose) console.log('VIEW MSG is a manager brief')
          let brief = {}
          inc++
          // reading strings returns item, increment
          temp = MSGS.readFrom(msg, inc, 'string')
          inc += temp.increment
          brief.interpreterName = temp.item
          temp = MSGS.readFrom(msg, inc, 'string')
          inc += temp.increment
          brief.interpreterVersion = temp.item
          temp = MSGS.readFrom(msg, inc, 'uint16')
          inc += temp.increment
          brief.numHunks = temp.item
          // set local,
          this.interpreterName = brief.interpreterName
          this.interpreterVersion = brief.interpreterVersion
          // and write it down
          //msgbox.briefState.setFromBrief(brief)
          if (cbd) cbd.callback(brief)
          break
        case MK.LISTOFAVAIL:
          if (msgverbose) console.log('VIEW MSG is a list of available items')
          let stringlist = MSGS.readListFrom(msg, inc + 1, 'string')
          if (cbd) {
            cbd.callback(stringlist)
          } else {
            // this shouldn't happen w/o a request attached
            console.error('something is up !')
          }
          break
        case MK.HUNKALIVE:
          // this can refer to new hunks, and modified hunk descriptions
          // i.e. changing a list of outputs and inputs
          if (msgverbose) console.log('VIEW MSG is a new hunk')
          let spec = specBySerial(msg, inc + 1, false)
          // so first we check for an existing hunk,
          let nd
          if (defs[spec.ind] === undefined) {
            nd = newDef(spec)
            //console.log('the nd', nd)
            //msgbox.briefState.decrementHunks()
            msgbox.write(`added a new hunk: ${spec.name}`)
          } else {
            if (verbose) console.log('updating hunk at', spec.ind)
            nd = updateDef(spec)
            //msgbox.write(`updated ${spec.name}_${spec.ind} with a new definition`)
          }
          if (cbd) cbd.callback(nd)
          break
        case MK.HUNKREPLACE:
          // to add inputs or outputs, this is sent, all links are eliminated,
          // and they are sent again by the manager
          if (msgverbose) console.log('VIEW MSG is a hunk replacement')
          let repSpec = specBySerial(msg, inc + 1, false)
          if (defs[repSpec.ind] === undefined) {
            console.error('received hunk replace for non existent hunk')
            console.error('ere is the spec:', repSpec)
          } else {
            replaceDef(repSpec)
            //msgbox.write(`replaced ${repSpec.name}_${repSpec.ind} with a new definition`)
            if (cbd) cbd.callback(nd)
          }
          break
        case MK.HUNKSTATECHANGE:
          if (msgverbose) console.log('VIEW MSG is a state change')
          let stchHnkInd = MSGS.readFrom(msg, inc + 1, 'uint16').item
          let stchStInd = MSGS.readFrom(msg, inc + 4, 'uint8').item
          let stDef
          try {
            stDef = defs[stchHnkInd].states[stchStInd]
            let stValUpdate = MSGS.readFrom(msg, inc + 6, stDef.type).item
            stDef.set(stValUpdate)
            if (cbd) cbd.callback(stDef)
            //msgbox.write(`changed state at ${stchHnkInd} ${stDef.name} to ${stValUpdate}`)
          } catch {
            // this is a likely early arrival of a state change update,
            // meaning we are likely *still* going to rx the def, with the update
            // so ... continue
            console.warn('state change request cannot find stDef, likely async manager messages, probably ok')
          }
          break
        case MK.HUNKREMOVED:
          if (msgverbose) console.log('VIEW MSG is a hunk to remove')
          let rmid = MSGS.readFrom(msg, inc + 1, 'uint16').item
          removeDef(rmid)
          if (cbd) cbd.callback(rmid)
          //msgbox.write(`rm'd hunk ${rmid}`)
          this.drawLinks()
          break
        case MK.LINKALIVE:
          if (msgverbose) console.log('VIEW MSG is a link to put')
          let nlnk = {}
          //console.log("LINK MSG IS", msg)
          nlnk.outInd = MSGS.readFrom(msg, inc + 1, 'uint16').item
          nlnk.outputInd = MSGS.readFrom(msg, inc + 4, 'uint8').item
          nlnk.inInd = MSGS.readFrom(msg, inc + 6, 'uint16').item
          nlnk.inputInd = MSGS.readFrom(msg, inc + 9, 'uint8').item
          if (putLink(nlnk.outInd, nlnk.outputInd, nlnk.inInd, nlnk.inputInd)) {
            //msgbox.write(`added a link`)
            if (cbd) cbd.callback(nlnk)
          } else {
            console.error('view could not write that link')
            if (cbd) cbd.errback('err for view to putLink')
          }
          break
        case MK.LINKREMOVED:
          if (msgverbose) console.log('VIEW MSG is a link to cut')
          let rlnk = {}
          rlnk.outInd = MSGS.readFrom(msg, inc + 1, 'uint16').item
          rlnk.outputInd = MSGS.readFrom(msg, inc + 4, 'uint8').item
          rlnk.inInd = MSGS.readFrom(msg, inc + 6, 'uint16').item
          rlnk.inputInd = MSGS.readFrom(msg, inc + 9, 'uint8').item
          if (cutLink(rlnk.outInd, rlnk.outputInd, rlnk.inInd, rlnk.inputInd)) {
            //msgbox.write(`removed a link`)
            if (cbd) cbd.callback(rlnk)
          } else {
            console.error('err for view to cutLink')
            if (cbd) cbd.errback('err for view to cutLink')
          }
          break
        default:
          throw new Error(`view receives message with no switch: ${msg}, ${msg[inc]}, ${typeof msg[inc]}, ${inc}`)
      } // end msgs switch
    } // end if-have-message

    // MSGS output check,
    if (outmsgbuffer.length > 0) {
      let debug = true
      if (!msgsout.io()) {
        if (debug) {
          let msg = outmsgbuffer.shift()
          if (msgverbose) this.log(`buffer release msg type: ${msg.header}`)
          //console.log(msg.content)
          msgsout.put(msg)
        } else {
          msgsout.put(outmsgbuffer.shift())
        }
      }
    } // end msgs output check

  } // end loop
}

export default View
