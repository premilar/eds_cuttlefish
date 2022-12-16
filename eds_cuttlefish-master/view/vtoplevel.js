/*
view/vtoplevel.js

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// just this fn...

import cfContextMenu from './vcontextmenu.js'
import DomTools from './vdom.js'

function makeTopLevel(view) {
  console.log(`MAKE TOP LEVEL ${view.name}`)
  // we need this friend as well,
  let dt = new DomTools(view)
  view.isTopLevel = true
  $(view.dom).attr('id', 'NROLVIEW')
  $(view.plane).attr('id', 'tlplane')
  // this is that (0,0) marker,
  // also needs more space ...
  $(view.plane).css('background', 'url("asset/bg.png")').css('width', '100px').css('height', '100px')
  // init transform of the plane,
  let dft = {
    s: 1,
    x: 0,
    y: 0,
    ox: 0,
    oy: 0
  }
  dt.writeTransform(view.plane, dft)
  dt.writeBackgroundTransform(view.dom, dft)

  view.getCurrentBounds = () => {
    let ct = dt.readTransform(view.plane)
    let w = view.dom.clientWidth / ct.s
    let h = view.dom.clientHeight / ct.s
    let x1 = -ct.x / ct.s
    let y1 = -ct.y / ct.s
    let x2 = w - x1
    let y2 = h - y1
    // move & shimmy by
    return {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      w: w,
      h: h
    }
  }

  // to zoom,
  view.dom.addEventListener('wheel', (evt) => {
    if (!$(evt.target).is('.view') && !$(evt.target).is('#floater')) {
      return false
    }
    evt.preventDefault()
    evt.stopPropagation()

    let ox = evt.clientX
    let oy = evt.clientY

    let ds
    if (evt.deltaY > 0) {
      ds = 0.025
    } else {
      ds = -0.025
    }

    let ct = dt.readTransform(view.plane)

    ct.s *= 1 + ds

    ct.x += (ct.x - ox) * ds
    ct.y += (ct.y - oy) * ds

    view.tls = ct.s
    // arduous, but
    for (let def of view.defs) {
      if (def.type === 'view' && def.name !== 'tlview') {
        def.hunk.tls = ct.s
      }
    }

    if (ct.s < 1) {
      dt.writeTransform(view.plane, ct)
      dt.writeBackgroundTransform(view.dom, ct)
    }

    view.drawLinks()
  })

  let zoomExtents = () => {
    // collector
    let psns = []
    for (let def of view.defs) {
      for (let fltr of def.floaters) {
        fltr.calculateSizes()
        psns.push({
          x: fltr.x,
          y: fltr.y,
          x1: fltr.bb.x1,
          y1: fltr.bb.y1,
          x2: fltr.bb.x2,
          y2: fltr.bb.y2
        })
      }
    }
    // ok then, probably bounds like
    let minx = 0
    let miny = 0
    let maxx = 500
    let maxy = 500
    for (let ps of psns) {
      if (ps.x + ps.x1 < minx) minx = ps.x + ps.x1
      if (ps.x + ps.x2 > maxx) maxx = ps.x + ps.x2
      if (ps.y + ps.y1 < miny) miny = ps.y + ps.y1
      if (ps.y + ps.y2 > maxy) maxy = ps.y + ps.y2
    }
    // currently,
    let ct = dt.readTransform(view.plane)
    let wd = view.dom.clientWidth
    let ht = view.dom.clientHeight
    // so, scale is
    let pfsx = (wd) / (maxx - minx)
    let pfsy = (ht) / (maxy - miny)
    let pfs = Math.min(pfsx, pfsy)
    // and we can write
    ct.s = pfs * 0.8 // breathing room,
    ct.x = -minx * pfs
    ct.y = -miny * pfs
    // and then,
    if (ct.s > 1) {
      ct.s = 1
      ct.x = -minx
      ct.y = -miny
    }
    // also,
    view.tls = ct.s
    for (let def of view.defs) {
      if (def.type === 'view' && def.name !== 'tlview') {
        def.hunk.tls = ct.s
      }
    }
    // contact,
    dt.writeTransform(view.plane, ct)
    dt.writeBackgroundTransform(view.dom, ct)
    view.drawLinks()
  } // end zoom extents

  view.zoomExtents = zoomExtents

  let canvasDragListener = (evt) => {
    evt.preventDefault()
    evt.stopPropagation()
    let ct = dt.readTransform(view.plane)
    ct.x += evt.movementX
    ct.y += evt.movementY
    dt.writeTransform(view.plane, ct)
    dt.writeBackgroundTransform(view.dom, ct)
    view.drawLinks()
  }

  let canvasUpListener = (evt) => {
    window.removeEventListener('mousemove', canvasDragListener)
    window.removeEventListener('mouseup', canvasUpListener)
  }

  // to pan,
  view.dom.addEventListener('mousedown', (evt) => {
    if ($(evt.target).is('.view')) {
      evt.preventDefault()
      evt.stopPropagation()
      window.addEventListener('mousemove', canvasDragListener)
      window.addEventListener('mouseup', canvasUpListener)
    } else if ($(evt.target).is('.input')) {
      // no op
    } else {
      // prevents bubbling up outside of the view, potentially a bug farm ?
      // evt.preventDefault()
      // evt.stopPropagation()
    }
  })

  let mousep = null

  document.addEventListener('mousemove', (evt) => {
    mousep = evt
  })

  // key listeners (are global, bc ...) KEYCODES
  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'm' && evt.ctrlKey) {
      // want this, but blocked by contextmenu wanting mouse location (from evt target)
      // find the mouse, make a position
      // do this by writing a target in
      // for this, we wrote a global mouse capture event ...
      evt.preventDefault()
      evt.stopPropagation()
      console.log('kd', evt)
      if(mousep){
        cfContextMenu(mousep, view, dt)
      } else {
        console.log(view)
        // probably a bugfarm, http://shrugguy.com
        let falseEvt = {
          target: view.dom,
          clientX: view.dom.clientWidth/3,
          clientY: view.dom.clientHeight/3,
          preventDefault: function(){},
          stopPropagation: function(){}
        }
        cfContextMenu(falseEvt, view, dt)
      }
    } else if (evt.key === 'k' && evt.ctrlKey) {
      evt.preventDefault()
      evt.stopPropagation()
      view.kick()
      //writeMessage('addhunk', 'link')
    } else if (evt.key === 'z' && evt.ctrlKey) {
      evt.preventDefault()
      evt.stopPropagation()
      zoomExtents()
    } else if (evt.key === 'q' && evt.ctrlKey) {
      evt.preventDefault()
      evt.stopPropagation()
      view.floop.quit()
      for (let def of view.defs) {
        if (def.type === 'view' && def.name !== 'tlview') {
          def.hunk.floop.quit()
        }
      }
    } else if (evt.key === 'e' && evt.ctrlKey) {
      evt.preventDefault()
      evt.stopPropagation()
      view.zebraHeirarchy(true)
    } else if (evt.key === 'd' && evt.ctrlKey) {
      evt.preventDefault()
      evt.stopPropagation()
      // your debug land,
      // ...
      //writeMessage('addprogram', 'ntlink')
    } else if (evt.key === 'v' && evt.ctrlKey) {
      //writeMessage('addprogram', 'llink')
    } else if (evt.key === 'g' && evt.ctrlKey) {
      // for the keystroke, debug
      view.globalOrganize(true)
    } else if (evt.keyCode === 27) {
      // escapekey
      console.log('escape!')
      view.floop.sim.stop()
      for (let def of view.defs) {
        if (def.type === 'view' && def.name !== 'tlview') {
          def.hunk.floop.sim.stop()
        }
      }
      $(view.dom).find('.contextmenu').remove()
      // also find floaters ...
    }
    return false
  })

  // PLACEMENT,

  view.getPositionForPlacement = (llview) => {
    let menu = $(view.dom).children('.contextmenu').get(0)
    if (menu !== undefined) {
      let mt = dt.readTransform(menu)
      let vt = dt.readTransform(view.plane)
      console.log('vt', vt)
      $(menu).remove()
      let xp = (mt.x - vt.x) * (1 / vt.s)
      let yp = (mt.y - vt.y) * (1 / vt.s)
      return {
        x: xp,
        y: yp
      }
    } else {
      return null
    }
  }

  /* QUEEN RECEPIES */

  // trace should return, for an output, the next input.
  // if the input is a link, it should try to traverse
  let trace = (output, debug) => {
    //console.log(`TRACE: tracing from ${output.name} in hunk ${output.parent.name} in view ${this.name}`)
    // ok, traces through links / heirarchy, returning final destination
    try {
      if (debug) console.log(`TRACE: begin or recurse from ${output.name} in ${output.parent.name} from ${output.parent.parentView.name} of ${output.parent.parentView.interpreterName}`)
      // of *connected* links
      if (output.connections.length !== 1) {
        // no connections exist, er, we can only do this for singleton lines
        if (debug) console.log('TRACE: no connections...')
        return false
      }
      let next = output.connections[0]
      //console.log(`TRACE: NEXT:`, next)
      if (next.parent.type === 'link') {
        // this is the heirarchy dive
        let thru = next.parent.reciprocalLink
        if (thru) {
          if (debug) console.log(`TRACE: next link`, thru)
          // a mirror,
          try {
            let otp = thru.outputs[next.ind]
            if (otp) {
              // return / recurse
              if (debug) console.log(`TRACE: diving -> ${otp.name}`)
              return trace(otp, debug)
            } else {
              if (debug) console.log(`TRACE: terminates at link, but no reciprocal to dive`)
              console.warn('on trace, found link, but no output on the other side')
              return false
            }
          } catch (err) {
            console.error('TRACE: err...')
            console.error(err)
            return false
          }
        } else {
          // could try doing a globalOrganize, or refresh ... cumbersome
          if (debug) console.log(`TRACE: terminates at link, but no reciprocal to dive`)
          console.warn('on trace, at link boundary, find no reciprocal link')
          return false
        }
      } else {
        if (debug) console.log(`TRACE: finally returns ${next.name} in ${next.parent.name} from ${next.parent.parentView.name} of ${next.parent.parentView.interpreterName}`)
        return next
      }
    } catch (err) {
      console.error("yep")
      console.error(err)
    }
  }

  view.trace = trace

  // notes on building a route:
  /*

  this is a pretty critical routine, and it's *perty neet*
  to make it real, needs to
   - operate when possible paths (unoccupied & same-type) or partial paths already exist
   - operate across multiple levels!
   - in deep future: choose shortest (& least busy?) path through existing graph
   - also: atm if links are not already spread (i.e. if link outputs don't match opposite inputs) ....
    - then we add one side at, say, index 2, and the other at, say. index 5 ... no bueno

  */

  view.buildRoute = (output, input, debug) => {
    return new Promise((resolve, reject) => {
      // first, we can check
      let pt = trace(output)
      if (pt) {
        resolve()
        return
      }
      // ok, first off, are these things in the same view? can I find a view from an outputs?
      let opv = output.parent.parentView
      let ipv = input.parent.parentView
      if (debug) console.log(`output parentview is ${opv.name} and input parent view is ${ipv.name}`)
      if (opv === ipv) {
        // we r on par
        if (debug) console.log(`BR: inputs are the same to ${view.name}`)
        opv.requestAddLink(output, input).then(() => {
          resolve()
        })
      } else {
        // ok, we have two views, and some string of links between them
        // let's first see if we can just find the route,
        // to find another bug (courtesy of the def-replace-polymorphism bugfarm)
        // we should run a .go before this...
        view.globalOrganize()
        // now,
        if (debug) console.log(`BR: GO completes, now build for:`)
        if (debug) console.log(`BR: from ${output.name} in ${output.parent.name} to ${input.name} in ${input.parent.name}`)
        let finroute = []
        // we are the top level ... but we should hunt by link,
        var recurse = (view, entrance, trace) => {
          if (debug) console.log(`BR: recurse to ${view.name}`)
          for (let df of view.defs) {
            if (df.type === 'link' && df !== entrance) {
              if (df.reciprocalLink) {
                if (debug) console.log(`BR: pushes to ntrace of len ${trace.length} exit for ${df.reciprocalLink.name}`)
                let borkit = JSON.parse(JSON.stringify(trace))
                borkit.push({
                  entrance: {
                    link: df.name,
                    view: view.name
                  },
                  exit: {
                    link: df.reciprocalLink.name,
                    view: df.reciprocalLink.parentView.name
                  }
                })
                if (df.reciprocalLink.parentView === ipv) {
                  if (debug) console.log(`BR: Makes view ${df.reciprocalLink.parentView.name} and ${ipv.name}`)
                  finroute = JSON.parse(JSON.stringify(borkit));
                } else {
                  recurse(df.reciprocalLink.parentView, df.reciprocalLink, JSON.parse(JSON.stringify(borkit)))
                }
              } else {
                if (debug) console.log(`BR: no reciprocal link for ${df.name} within ${view.name}`)
              }
            } // not a link
          }
        }
        recurse(opv, null, [])
        // ...
        if (debug) console.log(`BR: recursion ran to completion, route is len ${finroute.length}`)
        if (debug) console.log(`BR: the route:`, finroute)
        if (finroute.length < 1) {
          if (debug) console.log(`BR: no route returned...`)
          console.error("no route to build...")
          reject()
        }
        // should we resolve those objects? probably safe to assume that view names are unique,
        // these are the kinds of code snippets that happen when jake is betwixt cpp and js
        let resolver = (obj) => {
          // jeez
          let realView = view.defs.find((cand) => {
            return cand.name === obj.view
          })
          let handle = view
          if (realView.name !== "tlview") handle = realView.hunk
          let realLink = handle.defs.find((cand) => {
            return cand.name === obj.link
          })
          obj.view = handle
          obj.link = realLink
        }
        for (let item of finroute) {
          resolver(item.entrance)
          resolver(item.exit)
        }
        if (debug) console.log("BR: resolved to", finroute)
        // OK: we gotem
        // so!
        view.constructRoute(output, input, finroute).then(() => {
          resolve()
        })
      } // end not-same-view case,
    })
  }

  let rndByte = () => {
    return Math.round(Math.random() * 255)
  }

  view.constructRoute = (output, input, route) => {
    return new Promise((resolve, reject) => {
      // entrance to 0th is from the
      let lcounter = 0
      let wrap = async () => {
        // to start,
        // do first in route's entrance ...
        let entview = route[0].entrance.view
        let entlink = route[0].entrance.link
        let entiplist = entlink.states[2].value
        entiplist += `, auto_${rndByte()}_${entlink.outputs.length} (${output.type})`
        await entview.requestStateChange(entlink.states[2], entiplist)
        // it's new now, recall ?
        entlink = entview.defs[entlink.ind]
        await entview.requestAddLink(output, entlink.inputs[entlink.inputs.length - 1])
        // cover insides,
        for (let rt = 0; rt < route.length - 1; rt++) {
          let midview = route[rt].exit.view
          if (midview !== route[rt + 1].entrance.view) throw new Error("these should bridge... ")
          // ok,
          let from = route[rt].exit.link
          let to = route[rt + 1].entrance.link
          // and so,
          let tolist = to.states[2].value
          tolist += `, auto_${rndByte()}_${to.outputs.length} (${output.type})`
          console.log("FOR ST CHANGE TO", tolist)
          await midview.requestStateChange(to.states[2], tolist)
          to = midview.defs[to.ind]
          // similarely,
          let fromlist = from.states[3].value
          fromlist += `, auto_${rndByte()}_${from.outputs.length} (${output.type})`
          console.log("FOR ST CHANGE TO", fromlist)
          await midview.requestStateChange(from.states[3], fromlist)
          from = midview.defs[from.ind]
          // goddang, so then
          await midview.requestAddLink(from.outputs[from.outputs.length - 1], to.inputs[to.inputs.length - 1])
        }
        // cover outside,
        let outview = route[route.length - 1].exit.view
        let outlink = route[route.length - 1].exit.link
        let exitoplist = outlink.states[3].value
        exitoplist += `, auto_${rndByte()}_${entlink.outputs.length} (${output.type})`
        await outview.requestStateChange(outlink.states[3], exitoplist)
        // again, it new
        outlink = outview.defs[outlink.ind]
        await outview.requestAddLink(outlink.outputs[outlink.outputs.length - 1], input)
        console.log("FIN")
        resolve()
      }
      wrap()
    })
  }

  view.globalOrganize = (debug) => {
    if (debug) console.log("GO: KICKOFF ORGANIZING PARTY")
    // this is a request made:
    /*
    (1) when any view refreshes,
    (2) when we load a new patch
    (3) when we load a new system
    (4) when we build a route with .buildRoute(output, input)
    - this doesn't change topologies, or make any requests to managers,
    - it just organizes visually
    */
    // we need to recurse here,
    let recursor = (scope, order) => {
      if (debug) console.log(`Global Organize: recurses ${scope.name} at ${order}`)
      // scope is a view (hunk)
      // order is nth- level down tree, with us (toplevel) at root 0
      if (debug) console.log(`GO: scope defs, tl defs`)
      for (let df of scope.defs) {
        if (df.type === 'link' && df.grouptype !== 'edgecased') {
          // find recirprocal view relationship via trace, which returns an input, thru links,
          // given some output
          if (debug) console.log(`GO: trace from ${df.name} in ${scope.name}`)
          let rvi = trace(df.outputs[1], debug)
          if (debug) console.log(`GO: trace returns`, rvi)
          if (rvi) {
            // we have ah link definition, and ah view definition, connected by routing,
            // so we are safe to do
            let rvd = rvi.parent
            // if the rvd is a manager, this is the bottom level -> a link thru to a manager,
            if (rvd.type === 'manager') continue
            // and,
            if (debug) console.log(`GO: wrap ${df.name} around ${rvd.name}`)
            df.wrapon(rvd)
            rvd.unwrap()
            // find the dataport
            let dtprt = trace(df.outputs[0])
            if (dtprt) {
              dtprt.parent.unwrap()
            }
            // now, if we have ll data,
            if (rvd.hunk.hasRefreshed) {
              // find the interior link (by search for ol state)
              let oind = df.states.find((cnd) => {
                return cnd.name === 'otherLink'
              }).value
              if (!oind) throw new Error('cannot find link oind state for hookup')
              // doth it ?
              let internalLink = rvd.hunk.defs[oind]
              if (internalLink) {
                if (internalLink.type !== 'link') {
                  console.error('link mixup alert')
                  console.error(internalLink);
                }
                // hook em up
                df.reciprocalLink = internalLink
                internalLink.reciprocalLink = df
                // and do,
                internalLink.edgecase()
                // still logging these, bc it's nice 2 kno
                if (debug) console.log(`GO cn link ${df.name} to ${internalLink.name}`)
                // done w/ internal, now we can
                recursor(rvd.hunk, ++order)
              } else {
                console.error("organizing ... cannot find a reciprocal link")
              }
            }
          }
        }
      }
      // and roll zerbraHeirarchy in here also, using order ...
    }
    // kickoff w/
    recursor(view, 1)
    view.zebraHeirarchy()
  } // end globalOrganize


  view.zebraHeirarchy = (debug) => {
    // we can go about this just by the way the visual relationship is organized,
    let traverse = (view, lvl) => {
      if (lvl > 6) {
        console.warn('zebraHeirarchy traverses 6+ levels, you sure about this? exiting to avoid infinite loop')
        return
      }
      lvl++
      if (debug) console.log(`ZH traverses to ${view.name} at lvl${lvl}`)
      for (let df of view.defs) {
        if (df.type === 'link') {
          if (df.floatGroupType === 'wrappedon') {
            // this link 'contains' a view,
            if (lvl % 2 === 0) {
              if (debug) console.log(`ZH sets ${view.name} to f0`)
              $(df.reciprocalView.dom).css('background-color', '#f0f0f0')
              //$(df.deg.native).children('.view').css('background-color', '#f0f0f0')
            } else {
              if (debug) console.log(`ZH sets ${view.name} to e0`)
              $(df.reciprocalView.dom).css('background-color', '#e0e0e0')
              //$(df.deg.native).children('.view').css('background-color', '#e0e0e0')
            }
            traverse(df.reciprocalView, lvl)
          }
        }
      }
    }
    traverse(view, 0)
  }

  view.expandLink = (linkDef) => {
    return new Promise((resolve, reject) => {
      // to avoid mayhem, do
      linkDef.floaters[0].fix()
      // and then,
      view.requestAddHunk('view').then((viewDef) => {
        // jquery moves automatically ?
        console.log('EL: the view', viewDef.name)
        console.log('EL: the link', linkDef.name)
        // now we'd like to find a route from the view to the link
        // since we're global, we could try to build the 1st link,
        view.buildRoute(viewDef.outputs[0], linkDef.inputs[1]).then(() => {
          console.log("EL: Build Route Down Complete")
          return view.buildRoute(linkDef.outputs[1], viewDef.inputs[0])
        }).then(() => {
          console.log("EL: Build Route UP Complete")
          view.globalOrganize()
          resolve(viewDef)
        }).catch((err) => {
          console.error('EL: probable error during route construction')
          reject(err)
        })
      })
    })
  } // end expand recipe

  /* QUEEN HANDLERS */

  window.onresize = () => {
    view.onresize()
  }

  view.refreshAnyFreshViews = () => {
    for (let def of view.defs) {
      if (def.type == 'view' && def.name !== 'tlview') {
        if (def.hunk.hasRefreshed) {

        } else {
          console.log("NONREFRESHED")
          def.hunk.refresh()
        }
      }
    }
  }

  // built fast, should live with patchset
  view.restoreEntireSystem = (name, debug) => {
    // force it
    debug = true
    return new Promise((resolve, reject) => {
      view.patchset.getSystem(name).then((sys) => {
        if (debug) console.log('RESTORE SYSTEM: sys object', sys)
        // startup, track views to look for
        let recount = [];
        // ah recursor:
        let recursor = (scope, slice) => {
          if (debug) console.log(`RESTORE SYSTEM: ${scope.name}`)
          scope.patchset.mergePatch(slice, false).then(() => {
            // done here,
            recount.splice(recount.indexOf(scope.name), 1)
            // check if more to do
            for (let df of scope.defs) {
              if (df.type === 'link') {
                if (debug) console.log('RESTORE SYSTEM: found this link', df.name)
                // match link / contains to ...
                let vw = trace(df.outputs[1])
                if (vw) {
                  // this is a hack,
                  // if we're going to add more shit, we should increase by at least ...
                  if (vw.name === 'tlview') continue
                  vw = vw.parent.hunk
                  // if there's lower level work to do... (if this link 'contains' another patch, recursing)
                  let nl = slice.hunks[df.ind].contains
                  if (nl) {
                    if (debug) console.log('RESTORE SYSTEM: would like to load', nl)
                    recount.push(vw.name);
                    vw.refresh().then(() => {
                      if (debug) console.log('RESTORE SYSTEM: refreshed the context for, now recursing')
                      recursor(vw, nl)
                    })
                  } else {
                    if (debug) {
                      console.log(`RESTORE SYSTEM: nothing contained in next link`)
                    }
                  }
                } else {
                  if (debug) console.log(`RESTORE SYSTEM: no return from trace`)
                }
              }
            }
            //console.warn("RECOUNT NOW: ", recount)
            if (recount.length < 1) {
              //console.warn("RESTORE COMPLETE")
              resolve()
            }
          })
        }
        // startup,
        recount.push(view.name)
        recursor(view, sys)
      })
    })
  }

  // get the context menu on right click
  view.dom.addEventListener('contextmenu', (evt) => {
    cfContextMenu(evt, view, dt)
  })

}

export default makeTopLevel
