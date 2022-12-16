/*
view/vfloop.js

force loop for the dom div document world

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import frect from './frect.js'
import flink from './flink.js'

function Floop(View) {
  // it's not always the top level,
  let view = View

  // top level
  let nodes = []
  let links = []

  let onTick = () => {
    //console.log('tick')
    // bounds
    // let's also draw some svgs into the plane, to debug ...
    // ok ok, so ...
    let pa = {
      x: 0,
      y: 0
    }
    for (let nd of nodes) {
      // moveTo() calls drawLinks
      let p = nd.moveTo()
      pa.x += p.x
      pa.y += p.y
    }
    if (pa.x > 2 || pa.y > 2) {
      let incx = 0
      let incy = 0
      if (pa.x > 2) incx = pa.x
      if (pa.y > 2) incy = pa.y
      // hot/quickfix
      //view.requestSizeIncrease(incx, incy)
    }
    view.drawLinks()
  }

  let onEnd = () => {
    //console.log(`FLOOP COMPLETE ${view.name}`)
  }

  let isquit = false;

  this.quit = () => {
    if(isquit){
      isquit = false
      this.reset()
    } else {
      this.sim.stop()
      isquit = true
    }
  }

  this.tick = () => {
    if(isquit){
      view.drawLinks()
    } else {
      this.sim.alpha(1)
      this.sim.restart()
    }
  }

  // try this 1st with one-type of def / deg, then rewrite deg structure
  // a bit confusion, floop.reset !== floop.sim.restart()
  this.reset = () => {
    if(isquit) return
    //console.log(`FLOOP RESET ${view.name}`)
    // if we don't stop it before we write new stuff, lots of NaNs appear
    if (this.sim) this.sim.stop()
    // a new sim,
    nodes.length = 0
    links.length = 0

    // NODEHUNTR 1K1
    for (let df in view.defs) {
      let def = view.defs[df]
      for (let fl in view.defs[df].floaters) {
        // ok, have def indice df, and floater indice fl
        let floater = def.floaters[fl]
        // we are going to flatten this, basically, so we want to track,
        // oh no, this time they are the same, node just keeps a list of floaters
        // we still have to push it in tho
        // we also want to make sure sizes are all up to date ...
        floater.calculateSizes()
        // have to track this, for below
        floater.simIndex = nodes.length
        nodes.push(floater)
        // ok,
      } // end for-each floater-in-def
    } // end for-each-def

    // LINKHUNTR 9000
    for (let nd in nodes) {
      let node = nodes[nd]
      // ok, if it contains a *set* of outputs
      let otps = node.bag.find((cand) => {
        return cand.type === 'outputs'
      })
      if (otps) {
        //console.log('got `em')
        // small reacharound & walkabout,
        for (let opi in otps.def.outputs) {
          let op = otps.def.outputs[opi]
          for (let cn of op.connections) {
            // cn is an input, we need to find a reciprocal,
            // there won't *really* be that many floaters, max 4 or so,
            // so this is almost acceptable
            let recip
            let inindex
            let inoff
            // 'l1' and 'l2' tags are labels for these loops, so that I can break both
            // by saying 'break l1'
            l1: for (let flt of cn.parent.floaters) {
              l2: for (let item of flt.bag) {
                if (item.type === 'inputs') {
                  inindex = cn.ind
                  inoff = item.offsetY
                  recip = flt
                  break l1
                }
              }
            }
            if (recip) {
              // yikes: toff, yoff by bagitem's y-offset ...
              links.push({
                source: parseInt(nd), // the node that the link is from ...
                sy: opi,
                soff: otps.offsetY,
                target: recip.simIndex, // pointing at ...
                ty: inindex,
                toff: inoff
              })
            } else {
              console.error('could not find reciprocal floater for an output')
            }
          }
        }
      }
    } // end node-in-node search for links

    // do calc sizes for each,
    for(let nd of nodes) {
      nd.calculateSizes()
    }

    // we restart the simulation by writing over it w/ a new one
    this.sim = d3.forceSimulation(nodes)
      // don't touch,
      .force('rectcollide', frect().strength(1))
      // small charge to repel
      // .force('charge', d3.forceManyBody().strength(-1000))
      // spring 2gether
      /*
      .force('link', d3.forceLink(links).distance((link) => {
        // nodes are floaters, links have indice, could do like
        return 150
      }).strength(1)) */
      // our link,
      .force('dirlink', flink(links).distance((link) => {
        return 100
      }).strength(0.1))
      .on('tick', onTick)
      .on('end', onEnd)
    // to go manuel, call sim.stop()
    // then we can call sim.tick() as we wish,
  } // end this.reset()

}

export default Floop
