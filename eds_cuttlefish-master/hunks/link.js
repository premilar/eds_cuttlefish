/*
hunks/link.js

encapsulate external dataflow environments in local abstraction

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/


// HEADER
import {
  Hunkify,
  Input,
  Output,
  State
} from './hunks.js'
// END HEADER

import {
  TSET,
  LK,
  MSGS,
  findPhy
} from '../typeset.js'

function Link() {
  Hunkify(this)

  let debug = false

  let dtin = new Input('byteArray', 'data', this)
  this.inputs.push(dtin)

  let dtout = new Output('byteArray', 'data', this)
  this.outputs.push(dtout)

  // needs 2 trak status
  let isActive = new State('boolean', 'isActive', false)
  let otherLink = new State('uint16', 'otherLink', 0)
  this.states.push(isActive, otherLink)
  // default messages -> manager, besides also data link
  let inputList = new State('string', 'inputList', "mgrMsgs (byteArray)")
  let outputList = new State('string', 'outputList', "mgrMsgs (byteArray)")
  this.states.push(inputList, outputList)

  /* ---------------------------    ---------------------------- */
  /* ------------------ OP ON KEYS FROM STATE ------------------ */
  /* ---------------------------    ---------------------------- */

  let getTypeAndNameKeys = (str) => {
    let keys = str.split(',')
    // console.log('keys', keys)
    let ks = new Array()
    for (let i in keys) {
      let tk = keys[i].substring(keys[i].indexOf('(') + 1, keys[i].indexOf(')'))
      let nk = keys[i].substring(0, keys[i].indexOf(' ('))
      if (nk[0] == ' ') nk = nk.substring(1)
      if (tk.length < 2 || nk.length < 2) {
        this.log('bad key pair on inputs / outputs at link')
      } else {
        ks.push({
          typeKey: tk,
          nameKey: nk
        })
      }
    }
    return ks
  }

  let swapLists = (newList, input) => {
    // list,
    let nks = getTypeAndNameKeys(newList)
    // old list,
    let oks
    if (input) {
      oks = this.inputs
    } else {
      oks = this.outputs
    }
    // one by one, down the list we go
    for (let kp = 0; kp < nks.length; kp++) {
      // we'l walk the inputs array in step,
      // if the input we want already exists in oks, we'll place that
      let ioe = -1 // 'index of existing placement'
      for (let io in oks) {
        if (oks[io].name === nks[kp].nameKey && oks[io].type === nks[kp].typeKey) {
          ioe = io
          continue
        }
      }
      if (ioe >= 0) {
        if (input) {
          this.inputs[kp + 1] = oks[ioe]
        } else {
          this.outputs[kp + 1] = oks[ioe]
        }
      } else {
        // the object doesn't already exist,
        if (input) {
          // we can only make types we have serialization routines for:
          let phy = findPhy(nks[kp].typeKey)
          if(phy.key && phy.read){
            this.inputs[kp + 1] = new Input(nks[kp].typeKey, nks[kp].nameKey, this, true)
          }
        } else {
          let phy = findPhy(nks[kp].typeKey)
          if(phy.key && phy.write){
            this.outputs[kp + 1] = new Output(nks[kp].typeKey, nks[kp].nameKey, this, true)
          }
        }
      }
    }

    if (input) {
      while (this.inputs.length - 1 > nks.length) {
        this.inputs.pop()
      }
    } else {
      while (this.outputs.length - 1 > nks.length) {
        this.outputs.pop()
      }
    }
  }

  // now the changes,
  inputList.onChange = (value) => {
    // OK: back up to this ...
    swapLists(value, true)
    // we have to report this ...
    this.mgr.evaluateHunk(this)
    // if OK
    inputList.set(value)
  }

  outputList.onChange = (value) => {
    swapLists(value, false)
    this.mgr.evaluateHunk(this)
    // this has to follow on, to complete the promise ?
    // this necessitates that we write a manager-message-buffer on embedded,
    // and breaks one-program-item-at-a-time rules
    outputList.set(value)
  }

  /* ---------------------------    ---------------------------- */
  /* -------------------------- INIT --------------------------- */
  /* ---------------------------    ---------------------------- */

  this.init = () => {
    // since we know this needs to default to nc, and many programs
    // will save with these states set 'true', we reset them now.
    //otherLink.set(0)
    //isActive.set(false)
    otherLink.value = 0
    isActive.value = false
    // just add in order
    let ipKeys = getTypeAndNameKeys(inputList.value)
    for (let kp of ipKeys) {
      if(findPhy(kp.typeKey).key && findPhy(kp.typeKey).read){
        this.inputs.push(new Input(kp.typeKey, kp.nameKey, this, true))
      }
    }

    let opKeys = getTypeAndNameKeys(outputList.value)
    for (let kp of opKeys) {
      if(findPhy(kp.typeKey).key && findPhy(kp.typeKey).write){
        this.outputs.push(new Output(kp.typeKey, kp.nameKey, this, true))
      }
    }

  }

  /* ---------------------------    ---------------------------- */
  /* ---------------------- LINK STATE ------------------------- */
  /* ---------------------------    ---------------------------- */

  // a wait-state
  let isOpening = false

  let openup = (reqResponse) => {
    // exit when already opening, this is called
    // whenever an input port is occupied (wanting to send)
    if (isOpening) return
    // ??
    let msg = [LK.HELLO]
    MSGS.writeTo(msg, this.ind, 'uint16')
    if (reqResponse) {
      // if we're already open, we gucc
      MSGS.writeTo(msg, true, 'boolean')
      //console.log('link trying to open up', msg)
      isOpening = true
    } else {
      // otherwise we need to ask for a hello in return
      MSGS.writeTo(msg, false, 'boolean')
      // console.log('link replying to open up', msg)
    }
    dtout.put(msg)
  }

  let dataout = (data) => {
    if (!isActive.value) {
      console.error('attempt to put on not-active link')
    } else {
      if (!Array.isArray(data)) console.error('non-array put at link')
      dtout.put(data)
    }
  }

  /* ---------------------------    ---------------------------- */
  /* ----------------------- SERIALIZE ------------------------- */
  /* ---------------------------    ---------------------------- */

  // deserialize msgs: data is an array of bytes
  let demsg = (data) => {
    if (!Array.isArray(data)) {
      console.log(data)
      throw new Error(`link demsg receives non-array, logged above`)
    }
    // WRITE IT
    let msg = {}
    // this is quick here, but in c ...
    if (data[0] === LK.HELLO) {
      //console.log('demsg for hello', data)
      msg.isHello = true
      msg.otherLink = MSGS.readFrom(data, 1, 'uint16').item
      msg.reqReturn = MSGS.readFrom(data, 4, 'boolean').item
      return msg
    }
    // data[0] is the route, the link we need to bump on
    msg.port = data[0]
    // check for ack,
    if (data[1] === LK.ACK) {
      msg.isAck = true
      return msg
    }
    // otherwise, get phy and write out
    let phy = TSET.find((item) => {
      return item.key === data[1]
    })
    if (phy === undefined) throw new Error(`type not found at deserialization for expected key ${data[1]}`)
    msg.data = phy.read(data, 1).item
    if (debug) console.log('demsg:', msg)
    return msg
  }

  let outbuffer = new Array()

  // this ...
  let ack = (port) => {
    let msg = new Array()
    msg.push(port, LK.ACK)
    outbuffer.push(msg)
  }

  // serialize messages:
  let sermsg = (port, data, type) => {
    if (typeof port !== 'number' || port > 254) throw new Error('port is no good at serialize')
    // we r ready,
    let msg = [port]
    MSGS.writeTo(msg, data, type)
    if (debug) console.log('LINK sermsg to outbuffer', msg)
    outbuffer.push(msg)
  }

  this.loop = () => {
    // (1) check for data
    if (dtin.io()) {
      // if there's data on the line, we might be opening or operating ...
      // pulls every time, this is ok because we trust the other link
      // to be flow-controlling: this should either be for an open port or
      // an ack,
      // pull it and deserialize it,
      let msg = demsg(dtin.get())
      // ack,
      if (msg.isAck) {
        if (debug) console.log('link ack conf on ', msg.port)
        // AN ACK
        if (this.inputs[msg.port].isNetClear) {
          throw new Error('received ack on unexpected port')
        }
        // is clear upstream
        this.inputs[msg.port].icus = true;
      } else if (msg.isHello) {
        // HELLO OTHERLINK
        // if we're not open, now we are
        if (!isActive.value) {
          isActive.set(true)
        }
        isOpening = false
        otherLink.set(msg.otherLink)
        if (msg.reqReturn) {
          openup(false)
        }
      } else {
        // not an ack or a hello, do regular msg stuff
        // check port existence
        if (this.outputs[msg.port] === undefined) {
          // new approach: blind ackit
          ack(msg.port)
          console.warn('blind ack')
          return
          //throw new Error(`link receives message for port not listed: ${msg.port}`)
        }
        // not an ack, for port, if open, put data
        if (!(this.outputs[msg.port].io())) {
          // clear ahead, typecheck and put
          if (debug) console.log('link putting', msg.data, 'on', msg.port)
          this.outputs[msg.port].put(msg.data)
          this.outputs[msg.port].needsAck = true
          // and ack when it is pulled off,
        } else {
          // oboy: we pulled it off of the link, so
          console.log(`WARN: link receives message for occupied port: ${msg.port}, ${this.outputs[msg.port].name}`)
          console.log('the msg', msg)
        }
      }
      // this is an array, we have to deserialize it
    } // end if(dataIn is occupied)

    // (2) check if we can put
    if (!(dtout.io()) && outbuffer.length > 0) { // if we can send things to the world, do so
      if (!isActive.value) {
        // clear-to-send upstream, we don't have sync state, so
        // want to open, want a reply
        openup(true)
        return
      }
      // because of looping sys, we can only do this once per turn
      let turn = outbuffer.shift()
      if (debug) console.log('LINK OUT ->>', turn)
      dataout(turn)
    }

    // (3) check if we can ack, if data has been consumed
    for (let o = 1; o < this.outputs.length; o++) {
      // if now clear, ack back
      if (this.outputs[o].needsAck && !this.outputs[o].io()) {
        // CLEANUP: .needsAck to false -> ack fn ?
        this.outputs[o].needsAck = false
        ack(o)
      }
    }

    // (4) look at inputs and see if we can put anything on the line
    for (let i = 1; i < this.inputs.length; i++) {
      // only pull off of inputs if we are known to be clear downstream
      if (this.inputs[i].icus && this.inputs[i].io()) {
        if (!isActive.value) {
          // nc, but wants to send, so ... and don't pull offline yet
          // so ping to open up,
          openup(true)
          return
        }
        let data = this.inputs[i].get()
        if (debug) console.log(`link pulling message from input ${i}, data is ${data}`)
        // now we must wait for ack,
        this.inputs[i].icus = false;
        sermsg(i, data, this.inputs[i].type)
      }
    }

  } // end loop
}

// FOOTER
export default Link
// END FOOTER
