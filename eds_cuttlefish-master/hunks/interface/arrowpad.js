/*
hunks/interface/arrowpad.js

arrowpad pressure

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
} from '../hunks.js'

function Arrowpad() {
  Hunkify(this)

  const pairs = [{
      name: 'left',
      code: 37,
      output: new Output('boolean', 'left', this)
    }, {
      name: 'right',
      code: 39,
      output: new Output('boolean', 'right', this)
    }, {
      name: 'up',
      code: 38,
      output: new Output('boolean', 'up', this)
    }, {
      name: 'down',
      code: 40,
      output: new Output('boolean', 'down', this)
    }, {
      name: 'pgup',
      code: 33,
      output: new Output('boolean', 'pgup', this)
    }, {
      name: 'pgdown',
      code: 34,
      output: new Output('boolean', 'pgdown', this)
    }
  ]

  for(let pair of pairs){
    // current state,
    pair.down = false
    pair.buffer = []
    this.outputs.push(pair.output)
  }

  // as is tradition,
  this.dom = {}

  this.init = () => {
    // manager calls this once
    // it is loaded and state is updated (from program)
    console.log('HELLO KEYDOWN')
    this.dom = $('<div>').get(0)
    //this.dom = document.createElement('div')
  }

  let activeStatus = false;
  let activeColor = '#d981eb'
  let idleColor = '#82aef5'

  let removeKeyBindings = () => {
    document.removeEventListener('keydown', keyDownListen)
    document.removeEventListener('keyup', keyUpListen)
    // no sticky keys!
    clearAllKeys()
  }

  let setKeyBindings = () => {
    document.addEventListener('keydown', keyDownListen)
    document.addEventListener('keyup', keyUpListen)
  }

  let keyDownListen = (evt) => {
    if(evt.repeat) return
    let key = pairs.find((cand) => {
      return cand.code === evt.keyCode
    })
    if(key) {
      key.buffer.push(true)
    }
  }

  let keyUpListen = (evt) => {
    let key = pairs.find((cand) => {
      return cand.code === evt.keyCode
    })
    if(key) {
      key.buffer.push(false)
    }
  }

  let clearAllKeys = () => {
    for(let key of pairs){
      key.down = false
    }
  }

  this.onload = () => {
    let domain = $('<div>').get(0)
    let msg = $('<div>').text('~ click in to activate ~').get(0)
    $(msg).css('padding-top', '35px')
    $(domain).append(msg)
    $(domain).css('background-color', idleColor)
    $(domain).width(400).height(400)
    $(domain).css('text-align', 'center')
    $(domain).css('font-size', '18px')
    $(domain).css('color', 'white')
    $(this.dom).append(domain)
    this.dom.addEventListener('click', (evt) => {
      if (activeStatus) {
        activeStatus = false
        $(msg).text('~ click in to activate ~')
        $(domain).css('background-color', idleColor)
        removeKeyBindings()
      } else {
        activeStatus = true
        $(msg).text('~ push push push ~')
        $(domain).css('background-color', activeColor)
        setKeyBindings()
      }
    })
  }

  // puts true when transitioning to down, puts false when lifting up
  // downstream evts can do whatever they like, either track state or
  // also run safety timeouts

  // this is actually kind of a nontrivial statemachine, bc we have to
  // potentially flow-control buffer output events in the order that they
  // happened ... use pairs, setup each one as a statemachine
  this.loop = () => {
    for(let key of pairs){
      if(!(key.output.io()) && key.buffer.length > 0){
        let signal = key.buffer.shift()
        //console.log(`putting to ${key.output.name}, ${signal}`)
        key.output.put(signal)
      }
    }
  }
}

export default Arrowpad
