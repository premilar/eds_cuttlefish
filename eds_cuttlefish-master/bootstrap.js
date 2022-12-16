/*
bootstrap.js

client-side bootup of dataflow environment, and views into 

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// IDDE sends msgs to manager, does display etc
// starts with a native manager

/* codename NROL39 aka cuttlefish */
/* aka the teuthologist */

// this is toplevel, UI is meta-hunk
// we run loop where UI passes messages to bower manager
// this is like the manager 'bootstrap' file ?

'use strict'

import Manager from './hunks/manager.js'
import TLV from './view/vtoplevel.js'

// this is the TL
// but heirarchichally, we can slave views to managers ...
// views push messages to managers ...

// our invisible overlord
let NROL = new Manager()
NROL.name = 'nrol'
// init sets type and ind,
NROL.init()
// this is going to sit in the outbuffer until the view resolves

// want handles on this we think ?
let view = {}
let land

// runs the loop inside of V8's loop: this way our interpreter is non-blocking
// for other js async business
function bootloop() {
  // js u wyldin ! (this is probably slow)
  try {
    NROL.loop()
  } catch (err) {
    console.error('ERR @ top of loop:', err)
    // write to the toplevel msgbox
    view.msgbox.write('ERR @ top of loop, see console, program halting!')
    console.error('loop halting, mgr bailing')
    return
  }
  setTimeout(bootloop)
}

window.onload = () => {
  console.log('BOOTUP')
  NROL.addHunk('view', 'tlview').then((vw) => {
    // console.log('ADDHUNK VIEW RESOLVES')
    // gotta git this
    view = vw
    $('#wrapper').get(0).append(view.dom)
    // itself
    view.onload()
    TLV(view)
    console.log("MTL'd")
  }).then(() => {
    // outHunkIndex, outIndex, inHunkIndex, inIndex, debug
    NROL.addLink(1, 0, 0, 0, false)
    NROL.addLink(0, 0, 1, 0, false)
    bootloop()
    // kick this later
    setTimeout(() => {
      view.refresh().then(() => {
        // if you make links work properly (directionfull)
        // you can just pin view outputs to the left, collected,
        // and the rest should sort itself out
        //view.defs[0].floaters[0].fixTo(700,200)
        view.defs[1].unwrap()
        view.defs[1].floaters[0].fixTo(400, 100)
        //view.defs[1].floaters[1].fixTo(800, 300)
        // xtra
        /*
        view.patchset.mergePatch('lsocket').then(() => {
          let nlink = view.defs.find((cnd) => {
            return cnd.type === 'link'
          })
          nlink.floaters[0].fixTo(500,500)
          let nview = view.defs.find((cnd) =>{
            return (cnd.type === 'view' && cnd.name !== 'tlview')
          })
          view.zoomExtents()
          nview.hunk.refresh()
        })
        */
      })
    }, 100)
  }).catch((err) => {
    console.log(err)
  })
}
