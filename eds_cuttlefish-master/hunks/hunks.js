/*
hunks/hunks.js

boilerplate js for hunks,

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

/* ---------------------------    ---------------------------- */
/* ------------------------ HUNKITUP ------------------------- */
/* ---------------------------    ---------------------------- */

import {
  TSET,
  findPhy
} from '../typeset.js'

function Hunkify(hunk) {
  // scripting languages should name hunks by their script location and filename
  // compiled languages will assign a string
  // because this is always added by .addHunk(path) (path == name)
  // we set this during load, only once, this avoids some confusion
  hunk.type = null
  hunk.name = null
  // we keep a copy of our position-in-the-array ... of our parent ... our pip
  hunk.ind = null

  hunk.log = function(msg) {
    let str = `LG from ${hunk.name} at ${hunk.ind}: `
    for (let i = 0; i < arguments.length; i++) {
      str += arguments[i]
      if (i < arguments.length - 1) str += ', '
    }
    console.log(str)
  }

  // input, output, and state: ay balls, here we go
  hunk.inputs = new Array()
  hunk.outputs = new Array()
  hunk.states = new Array()

  hunk.input = (type, name) => {
    let ip = new Input(type, name, hunk)
    hunk.inputs.push(ip)
    return ip
  }

  hunk.output = (type, name) => {
    let op = new Output(type, name, hunk)
    hunk.outputs.push(op)
    return op
  }

  hunk.state = (type, name, dfault) => {
    let st = new State(type, name, dfault)
    hunk.states.push(st)
    return st
  }

  // top-secret backdoor
  hunk.mgr = {}
}

/* ---------------------------    ---------------------------- */
/* ------------------------- OUTPUT -------------------------- */
/* ---------------------------    ---------------------------- */

function Output(type, name, parent, linktype) {
  // naming, etc
  this.name = name
  this.type = type
  this.phy = findPhy(this.type) // checks, throws error if type doesn't exist
  this.parent = parent
  // store,
  this.ref = null
  this.data = null
  // hookup
  this.connections = new Array()
  // check in realtime, manager does less
  this.io = () => {
    for (var i = 0; i < this.connections.length; i++) {
      // connection arrays contain 'wires' ... these are stateful
      if (this.connections[i].io) return true
    }
    return false
  }

  // when we put, we use this to set states
  this.setIo = () => {
    for (var i = 0; i < this.connections.length; i++) {
      this.connections[i].io = true
    }
  }

  /* ---------------------------    ---------------------------- */
  /* ------------ OUTPUT PUT AND TRANSPORT (TYPED) ------------- */
  /* ---------------------------    ---------------------------- */

  // yonder put call, transport call
  // copy-in (chances are that after .put call the referenced object changes, before it is copied out)
  // and copy-out (same on the other side, we are potentially passing to many downstream, need a different copy for each)
  // typing ... odd ?
  this.put = (data) => {
    if (!this.io()) {
      this.ref = data
      this.data = this.phy.copy[this.type](data)
      this.setIo()
      return true
    } else {
      console.error(`WARNING: put called on occupied output: output ${this.name} in ${this.parent.name}`)
      return false
    }
  }

  /* ---------------------------    ---------------------------- */
  /* ---------------- OUTPUT MANAGE CONNECTIONS ---------------- */
  /* ---------------------------    ---------------------------- */

  this.attach = (input) => {
    // we can only do this if a fn exists for us to copy from-us-to-them
    if (this.phy.copy[input.type]) {
      // the wire is the stateful part,
      let wire = {
        op: this,
        ip: input,
        io: false
      }
      input.connections.push(wire)
      this.connections.push(wire)
      return true
    } else {
      console.error(`ERROR: missing type conversion from: ${this.type} to ${input.type}`)
      return false
    }
  }

  this.remove = (input) => {
    // find by names pls
    let ind = this.connections.findIndex((cand) => {
      return (cand.ip === input)
    })
    if (ind !== -1) {
      input.disconnect(this)
      this.connections.splice(ind, 1)
      return true
    } else {
      console.log('ERROR: wire removal, was looking for', input, 'in', this.connections)
      return false
    }
  }

  this.findOwnIndex = () => {
    // find self in parent's inputs
    let index = this.parent.outputs.findIndex((cand) => {
      return (cand.name === this.name && cand.type === this.type)
    })
    if (index === -1) {
      console.log(`output could not find itself in parent: ${index}`, this, 'unstrung', this.parent.outputs, 'strung', JSON.parse(JSON.stringify(this.parent.outputs)))
      throw new Error(`output could not find itself in parent: ${index}`)
    }
    return index
  }

  this.disconnectAll = () => {
    for (let cn of this.connections) {
      // here we're disconnecting the input, meaning the input is removing this from its list of connections
      cn.ip.disconnect(this)
    }
    // this is actually a genuine way to delete an array in js, http://shrugguy.com
    this.connections.length = 0
  }

  /* ---------------------------    ---------------------------- */
  /* ----------- OUTPUT TRICKS FOR LINK CONNECTIONS ------------ */
  /* ---------------------------    ---------------------------- */
  if (linktype) {
    // has stash ?
    this.needsAck = false;
  }

} // FIN output

/* ---------------------------    ---------------------------- */
/* -------------------------- INPUT -------------------------- */
/* ---------------------------    ---------------------------- */

function Input(type, name, parent, linktype) {
  // naming, etc
  this.name = name
  this.type = type
  this.parent = parent
  this.phy = findPhy(this.type)
  // we keep access to the outputs we're hooked up to here
  this.connections = new Array()
  this.io = () => {
    // if any of our connections have data that we haven't read once yet,
    for (var i = 0; i < this.connections.length; i++) {
      // have to update calls to .io -> .io()
      if (this.connections[i].io) return true
    }
    return false
  }
  // get calls are now a bit messier,
  // we have multiple wires,
  this.lastGet = 0 // place we read from last (have multiple wires case)
  this.get = () => {
    // we want to (roughly) round robin these, so we pick up from where we last pulled,
    var i = this.lastGet
    // find the next occupied conn: do iterations max. of total length of connections,
    for (var u = 0; u < this.connections.length; u++) {
      // increment, wrap
      i++
      if (i >= this.connections.length) i = 0
      // do work,
      if (this.connections[i].io) {
        let wire = this.connections[i]
        // and set that wire to read / empty
        wire.io = false
        // and we'd like to remember from whence we last took data
        this.lastGet = i
        // get this data out ... we have to copy it out again, otherwise
        // downstream operators may write to objects that have handles elsewhere
        // here we call the function from typeset.js that is custom between the-output -> and the-input
        return wire.op.phy.copy[this.type](wire.op.data)
      }
    }
    // if we pass this for w/o hitting return,
    console.error(`WARNING: get called on occupied input: ${this.name} in ${this.parent.name}`)
    return null
  }

  this.findOwnIndex = () => {
    // find self in parent's inputs
    let index = this.parent.inputs.findIndex((cand) => {
      return (cand.name === this.name && cand.type === this.type)
    })
    if (index === -1) throw new Error('input could not find itself in parent')
    return index
  }

  this.disconnect = (output) => {
    let index = this.connections.findIndex((cand) => {
      return (cand.op = output)
    })
    if (index === -1) throw new Error('during output disconnect, input cannot find output...')
    this.connections.splice(index, 1)
    // find the reference in our array,
  }

  this.disconnectAll = () => {
    for (let cn of this.connections) {
      cn.op.remove(this)
    }
  }

  // inputs / outputs for 'link' (a hunk) ports have more state,
  if (linktype) {
    // assume clear upstream on startup, maybe dangerous?
    this.icus = true
  }

}

// working the onChange / change function (onChange feels more better?)
// if we do .on('change', (val) => {

//})
// we can potentially add ... .on('startup') or something, to set hard defaults ?

// and then: write out copy fn's per item ...

function State(type, name, startup) {
  this.name = name
  this.type = type
  this.phy = findPhy(this.type) // types must have *some* code -> by finding one here, we check that it exists
  // TODO pls add check for missing startup value ?
  this.value = startup
  // this is still something of a hack
  // during load, the manager gets in here and dishes a function 2 us
  this.hookup = (newval) => {
    console.error('ERROR: when state-change request made, no hookup function yet - probable manager error while loading hunk')
  }
  // from within a hunk, we typically call this
  // to update the value and ship it out to any views
  this.set = (value) => {
    // for good measure, we copy-in state as well. who knows.
    this.value = this.phy.copy[this.type](value)
    this.hookup(this.value, this.msgid)
    this.msgid = null
  }
  this.msgid = null
  // the manager calls this fn, when a request is made.
  //
  this.tryChange = (value, msgid) => {
    // coupla steps here, we track and then call internal fn,
    this.msgid = msgid
    // not sure, but we could clean these here by doing this.phy.copy[this.type](value)
    if (this.onChange) {
      this.onChange(value)
    } else {
      this.set(value)
    }
  }
}

export {
  Hunkify,
  Input,
  Output,
  State
}
