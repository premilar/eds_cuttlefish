/*
hunks/manager.js

heart of the fish...

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
  TSET,
  MK,
  HK,
  MSGS
} from '../typeset.js'

import GoGetter from '../gogetter.js'

function Manager() {
  Hunkify(this, 'Manager')
  // need this tool
  let gg = new GoGetter

  let msgsin = new Input('byteArray', 'msgs', this)
  let msgsout = new Output('byteArray', 'msgs', this)

  this.inputs.push(msgsin)
  this.outputs.push(msgsout)

  // we have hunks,
  let hunks = new Array()
  this.hunks = hunks

  // we keep track of whether-or-not we have any connections ...
  this.isConnectedTo = false

  // debug flags
  let verbose = false
  let msgverbose = false
  let addHunkVerbose = false

  /* ---------------------------    ---------------------------- */
  /* ---------------------- BUILDING LIST ---------------------- */
  /* ---------------------------    ---------------------------- */

  // for now, managers take callback paths to pipe data back through ?
  let getListOfAvailableComponents = () => {
    return new Promise((resolve, reject) => {
      gg.recursivePathSearch('hunks/').then((list) => {
        resolve(list)
      }).catch((err) => {
        reject(err)
      })
    })
  }

  /* ---------------------------    ---------------------------- */
  /* ------------------------ SERIALIZE ------------------------ */
  /* ---------------------------    ---------------------------- */

  let serializeHunk = (hunk, bytes) => {
    // write the hunk into this array
    bytes.push(HK.IND)
    // here, we're counting on the hunk containing its own address-within-the-array
    // that gets set during an add, or decremented during a remove
    MSGS.writeTo(bytes, hunk.ind, 'uint16')
    // hunks are typed,
    bytes.push(HK.TYPE)
    MSGS.writeTo(bytes, hunk.type, 'string')
    // an id, also, is nice, for optional human names ? maybe ?
    bytes.push(HK.NAME)
    MSGS.writeTo(bytes, hunk.name, 'string')
    // write inputs,
    if (hunk.inputs.length > 0) {
      for (let ip of hunk.inputs) {
        // these should perhaps get their index, as well?
        // but we're sending them in order, so ...
        bytes.push(HK.INPUT)
        MSGS.writeTo(bytes, ip.name, 'string')
        MSGS.writeTo(bytes, ip.type, 'string')
      }
    }
    // write outputs,
    if (hunk.outputs.length > 0) {
      for (let op of hunk.outputs) {
        bytes.push(HK.OUTPUT)
        MSGS.writeTo(bytes, op.name, 'string')
        MSGS.writeTo(bytes, op.type, 'string')
        let slat = bytes.length
        if(op.connections.length > 0){
          bytes.push(HK.CONNECTIONS)
          for (let wire of op.connections) {
            //console.log('conn', cn)
            bytes.push(HK.CONNECTION)
            // yeah yeah ok,
            let bsixteen = []
            MSGS.writeTo(bsixteen, wire.ip.parent.ind, 'uint16')
            // err here: parent indice may be > 8b wide !
            // omitting keys,
            bytes.push(bsixteen[1], bsixteen[2], wire.ip.findOwnIndex());
          }
        }
      }
    }
    // write state,
    if (hunk.states.length > 0) {
      for (let st of hunk.states) {
        bytes.push(HK.STATE)
        MSGS.writeTo(bytes, st.name, 'string')
        MSGS.writeTo(bytes, st.type, 'string')
        // yarr, last is a debug flag
        MSGS.writeTo(bytes, st.value, st.type)
      }
    }
  }

  /* ---------------------------    ---------------------------- */
  /* ------------------- ADD / REMOVE A HUNK ------------------- */
  /* ---------------------------    ---------------------------- */

  let stateSetFromSerial = (msg, inc) => {
    let oginc = inc
    // pull state index / value pairs
    let temp
    let stateSet = []
    while (inc < msg.length && msg[inc] !== HK.NAME) {
      if (msg[inc] !== HK.STATE) throw new Error(`error reading in state set, starts with ${msg[start]} at ${start}, should be ${HK.STATE}`)
      let stateItem = {}
      inc += 1
      // name,
      let name = MSGS.readFrom(msg, inc, 'string')
      stateItem.name = name.item
      inc += name.increment
      // type,
      let type = MSGS.readFrom(msg, inc, 'string')
      stateItem.type = type.item
      inc += type.increment
      // pull type by key
      let phy = TSET.find((cand) => {
        return cand.key === msg[inc]
      })
      if (!phy) throw new Error(`error finding a key for this type, key is ${msg[inc]}`)
      // double double ... careful, you did this just a few lines above, from the string
      stateItem.type = phy.name
      // have type, do read
      temp = MSGS.readFrom(msg, inc, stateItem.type)
      stateItem.value = temp.item
      // push it into the set, [{name: 'str', type: 'type', value: ~}, {name: 'str', type: 'type', value: ~}]
      stateSet.push(stateItem)
      if (inc < 1) throw new Error('dangerous looping, exiting')
      inc += temp.increment
    }
    return {
      item: stateSet,
      increment: inc - oginc
    }
  }

  // type, (opt) name, (opt) state
  // work backwards
  this.addHunk = (hunkType, name, states) => {
    // hunks are named by path in js
    let path = './hunks/' + hunkType + '.js'
    if (verbose) console.log('ok, loading hunk from path', path)
    return new Promise((resolve, reject) => {
      gg.importSource(path, false).then((src) => {
        //console.log('the src from import', src)
        if (addHunkVerbose) console.log('gg importing source resolves', src)
        try {
          let hunk = sourceToHunk(src, hunkType, states, name)
          hunks.push(hunk)
          resolve(hunk)
        } catch (err) {
          // think these are handled at importSource (logging wise, so just)
          reject(err)
        }
      }).catch((err) => {
        reject(err)
      })
    })
  } // end addHunk function,

  let sourceToHunk = (src, type, states, name) => {
    // make the instance from the constructor
    let hunk = {}
    try {
      hunk = new src()
      if (addHunkVerbose) console.log('cast to hunk as thing is ok', hunk)
    } catch (err) {
      console.error('new() error', err)
      throw new Error('cannot cast hunk as new thing()')
    }

    // type it (this is just the path)
    hunk.type = type
    // if we were given a name,
    if (name) {
      hunk.name = name
    } else {
      hunk.name = hunk.type + '_' + hunks.length
    }
    // and ref it (this is its address in the array of hunks)
    // it's going to get pushed into this array next, so
    hunk.ind = hunks.length
    // a backdoor, a greeting, an ouroboros
    hunk.mgr = this

    // if we have state arguments, set those now by direct write,
    // this assumes that each item in the state array is present in the definition,
    if (states) {
      for (let st in states) {
        try {
          if (hunk.states[st].type !== states[st].type) {
            console.error('skipping state update during hunk load, mismatched types')
          } else {
            hunk.states[st].value = states[st].value
          }
        } catch (err) {
          console.error('probably non-existent state while lookup via ind', err)
        }
      }
    }

    // now we open our doors to state changes
    // also: instead of this, since hunks have mgr hooks, something else?
    if (Array.isArray(hunk.states)) {
      for (let st in hunk.states) {
        hunk.states[st].hookup = (value, msgid) => {
          //console.log('MGR -> View StateChange Return ... ')
          let msg = [MK.HUNKSTATECHANGE]
          MSGS.writeTo(msg, hunk.ind, 'uint16')
          // these calls to 'parseInt' on what look like indexed for-loops
          // i.e. this for (let ...) is a javascriptism:
          // an Array is just a JS object, so indices are also js 'key'
          // and in a 'for item in iterable' loop in js, it assigns to each
          // instance of item the 'key', keys being strings, hence the index
          // coming through as a string... jsArray[1] is the same as jsArray["1"]
          MSGS.writeTo(msg, parseInt(st), 'uint8')
          MSGS.writeTo(msg, value, hunk.states[st].type)
          // console.log('replying state with:', msgid)
          idSafeReply(msgid, msg)
        }
      }
    }

    // run init code (apres state setup!)
    if (hunk.init != null) {
      try {
        hunk.init()
      } catch (err) {
        console.error('ERR caught while running hunk init code', err)
      }
    }

    // if no loop function exists, write the empty case:
    if(!hunk.loop){
      hunk.loop = () => {}
    }

    // if the hunk has a dom, and we have a view, add it ...
    if (hunk.dom !== null && hunk.dom !== undefined) {
      // this is only allowed in the tlview, and we manage that...
      let tlv = hunks.find((cnd) => {
        return cnd.name == 'tlview'
      })
      // via bootloop, tlv is always 2nd element
      if (hunk.ind === 1 && hunk.type === 'view') {
        // rarecursion
        hunk.take(hunk)
      } else if (tlv === undefined) {
        writeErrMessage(`something is up ... no toplevelview, trying to add native hunk with dom element`)
      } else {
        tlv.msgbox.write('cf taking native hunk DOM element')
        tlv.take(hunk)
      }
    } // end if-have-dom

    return hunk
  }

  this.removeHunk = (ind) => {
    let hnk = hunks[ind]
    if (hnk === undefined) return false
    // else,
    for (let ip in hnk.inputs) {
      // dconn from outputs,
      hnk.inputs[ip].disconnectAll()
    }
    // outputs, of whom a reference is stored in previously-attached inputs
    for (let op in hnk.outputs) {
      hnk.outputs[op].disconnectAll()
    }
    // then rm
    hunks.splice(ind, 1)
    // and run deletion, if it exists
    if(hnk.onDelete){
      hnk.onDelete()
    }
    // now, hunks have been reordered, so
    onHunkReorder()
    // and confirm we have done the deed, the body is in the river
    return true
  }

  let onHunkReorder = () => {
    for (let ind in hunks) {
      // alright look, we keep a copy of this
      if (hunks[ind].ind !== parseInt(ind)) {
        // console.log(`swapping ${hunks[ind].ind} for ${parseInt(ind)}`)
        hunks[ind].ind = parseInt(ind)
      }
    }
  }

  // this is a utility that hunks can use when they modify themsleves,

  this.serializeAndSendHunk = (hunk, replace) => {
    let msg = []
    if (replace) {
      msg.push(MK.HUNKREPLACE)
    } else {
      msg.push(MK.HUNKALIVE)
    }
    serializeHunk(hunk, msg)
    writeMessage(msg)
  }

  // for links,

  let serializeAndSendLink = (output, input) => {
    let msg = [MK.LINKALIVE]
    MSGS.writeTo(msg, output.parent.ind, 'uint16')
    MSGS.writeTo(msg, output.findOwnIndex(), 'uint8')
    MSGS.writeTo(msg, input.parent.ind, 'uint16')
    MSGS.writeTo(msg, input.findOwnIndex(), 'uint8')
    writeMessage(msg)
  }

  // one for updating hunks,
  this.evaluateHunk = (hunk) => {
    // input and output lists have probably changed, so there's some work to do.
    // first, we reply with a new definition,
    this.serializeAndSendHunk(hunk, true)
    // on a renewed definition, the view will remove all links associated.
    // now we need to walk inputs and outputs, and message about the links
    // that still exist
    // so we can search over inputs ... since references are maintained
    // if there's anything attached to them, those are links to send
    for (let ip in hunk.inputs) {
      for (let cn in hunk.inputs[ip].connections) {
        serializeAndSendLink(hunk.inputs[ip].connections[cn].op, hunk.inputs[ip])
      }
    }
    // same with the outputs (or, no, they're included in the serialization, no?)
    // what does view think?
    for (let op in hunk.outputs) {
      for (let cn in hunk.outputs[op].connections) {
        serializeAndSendLink(hunk.outputs[op], hunk.outputs[op].connections[cn].ip)
      }
    }
  }

  /* ---------------------------    ---------------------------- */
  /* ----------------- LINKS HELLO / GOODBYTE ------------------ */
  /* ---------------------------    ---------------------------- */

  this.addLink = (outHunkIndex, outputIndex, inHunkIndex, inputIndex, debug) => {
    // synchronous, doesn't need to be a promise
    let outHunk = hunks[outHunkIndex]
    let inHunk = hunks[inHunkIndex]
    // throw possible errs,
    if (outHunk == undefined) {
      writeErrMessage("MGR on add link: outHunk is undefined, on request for: " + outHunkIndex)
      return false
    } else if (inHunk == undefined) {
      writeErrMessage("MGR on add link: inHunk is undefined, on request for: " + inHunkIndex)
      return false
    }

    // find outputs, inputs
    let otp = outHunk.outputs[outputIndex]
    let inp = inHunk.inputs[inputIndex]
    // throw errs,
    if (otp == undefined) {
      writeErrMessage('MGR on add link: output is undefined. on request for hunk: ' + outHunk.ind + " and output: " + outputIndex)
      return false
    } else if (inp == undefined) {
      writeErrMessage('MGR on add link: input is null or undefined. for hunk: ' + inHunk.ind + " and input: " + inputIndex)
      return false
    }
    // if we're here, have passed all selection gauntlets, so
    if (debug) this.log(`hooking ${outHunk.name} ${outHunk.ind}, ${otp.name} to ${inHunk.name} ${inHunk.ind}, ${inp.name}`)
    return otp.attach(inp)
  }

  this.removeLink = (outHunkIndex, outputIndex, inHunkIndex, inputIndex, debug) => {
    // synchronous, doesn't need to be a promise
    let outHunk = hunks[outHunkIndex]
    let inHunk = hunks[inHunkIndex]
    // throw possible errs,
    if (outHunk == undefined) {
      writeErrMessage("MGR on rm link: outHunk is undefined, on request for: " + outHunkIndex)
      return false
    } else if (inHunk == undefined) {
      writeErrMessage("MGR on rm link: inHunk is undefined, on request for: " + inHunkIndex)
      return false
    }

    // find outputs, inputs
    let otp = outHunk.outputs[outputIndex]
    let inp = inHunk.inputs[inputIndex]
    // throw errs,
    if (otp == undefined) {
      writeErrMessage('MGR on add link: output is undefined. on request for hunk: ' + outHunk.ind + " and output: " + outputIndex)
      return false
    } else if (inp == undefined) {
      writeErrMessage('MGR on add link: input is null or undefined. for hunk: ' + inHunk.ind + " and input: " + inputIndex)
      return false
    }
    // if we're here, have passed all selection gauntlets, so
    if (debug) this.log(`unhooking ${outHunk.name} ${outHunk.ind}, ${otp.name} to ${inHunk.name} ${inHunk.ind}, ${inp.name}`)
    return otp.remove(inp)
  }

  // programmatically, and as makes sense in memory, link connections are lists that are stored
  // at the output, but we serialize and communicate links, and hunks, separately.
  // ... while we have a lit of hunks to easily rip through while serializing that,
  // we don't have one for links, so this exists

  let writeLinkList = () => {
    let links = new Array()
    // for hunks,
    for (let hnk in hunks) {
      // have outputs,
      for (let otp in hunks[hnk].outputs) {
        for (let cn in hunks[hnk].outputs[otp].connections) {
          // we can know the output index, and the hunk index,
          // but we need to find the index-relative position for the input
          // RETURN
          links.push({
            outInd: parseInt(hnk), // truth in index
            outputInd: parseInt(otp), // a num,
            inInd: hunks[hnk].outputs[otp].connections[cn].parent.ind,
            inputInd: hunks[hnk].outputs[otp].connections[cn].findOwnIndex()
          })
        }
      }
    }
    // ok,
    return links
  }

  /* ---------------------------    ---------------------------- */
  /* ---------------------- STARTUP, LOOP ---------------------- */
  /* ---------------------------    ---------------------------- */

  this.init = () => {
    // startup by giving ourselves an ID if we haven't been assigned one?
    // and then adding ourselves to ourselves ?
    // have to cover these bases ourselves
    this.type = 'manager'
    this.ind = 0
    // nest in self,
    hunks.push(this)
    this.log(`manager hello`)
  }

  // just a tiny helper
  let idSafeReply = (msgid, bytes) => {
    if (msgid !== null && msgid !== undefined) {
      bytes = [MK.MSGID, msgid].concat(bytes)
    }
    writeMessage(bytes)
  }

  let idSafeError = (msgid, message) => {
    // sends this upstream... tricky relationship for node / browser, bc
    // browser can just log to console, but view wants to recv errors from all contexts in a
    // similar manner, yikes !
    // also log this for chrissake
    console.log('MANAGER ERRMSG', message)
    // only do this if the message is < 256b ?
    let msg = [MK.ERR]
    MSGS.writeTo(msg, message, 'string')
    idSafeReply(msgid, msg)
  }

  this.loop = () => {
    // getting messages
    if (msgsin.io()) {
      let msg = msgsin.get()
      if (msgverbose) console.log('MGR RX MSG:', msg)
      if (!Array.isArray(msg)) throw new Error(`manager throwing object message, having header ${msg.header}`)
      this.isConnectedTo = true
      // once
      let resp = new Array()
      let inc = 0
      // track msg-id
      let msgid
      if (msg[0] === MK.MSGID) {
        msgid = msg[1]
        inc = 2
      }
      // rules: bytes in this switch, objects elsewhere ?
      switch (msg[inc]) {
        case MK.HELLO:
          if (msgverbose) console.log('MGR MSG is hello')
          idSafeReply(msgid, [MK.HELLO])
          break
        case MK.QUERY:
          // do we have an index ?
          if (msg.length > inc + 1) {
            let queryIndex = MSGS.readFrom(msg, inc + 1, 'uint16').item
            if (msgverbose) console.log(`MGR MSG is a hunk query for ${queryIndex}`)
            if (hunks[queryIndex] === undefined) {
              let hunkErr = [MK.ERR]
              MSGS.writeTo(hunkErr, `cannot find a hunk at ${queryIndex}`, 'string')
              idSafeReply(msgid, hunkErr)
            } else {
              let serhunk = [MK.HUNKALIVE]
              serializeHunk(hunks[queryIndex], serhunk)
              idSafeReply(msgid, serhunk)
            }
          } else {
            if (msgverbose) console.log('MGR MSG is a top level query')
            /* proto err
            resp.push(MK.ERR)
            MSGS.writeTo(resp, 'an err msg on false query', 'string')
            idSafeReply(msgid, resp)
            */
            // with ids, this is ok
            resp.push(MK.BRIEF)
            MSGS.writeTo(resp, gg.interpreterName, 'string')
            MSGS.writeTo(resp, gg.interpreterVersion, 'string')
            MSGS.writeTo(resp, hunks.length, 'uint16')
            idSafeReply(msgid, resp)
          }
          break
        case MK.REQLISTAVAIL:
          if (msgverbose) console.log('MGR MSG is a request for available items')
          // allow for error path,
          getListOfAvailableComponents().then((list) => {
            // probable success,
            resp.push(MK.LISTOFAVAIL)
            for (let item of list) {
              MSGS.writeTo(resp, item, 'string')
            }
            idSafeReply(msgid, resp)
          }).catch((err) => {
            idSafeError(msgid, `at getListOfAvailableComponents, an error: ${err}`)
          })
          break
        case MK.REQADDHUNK:
          if (msgverbose) console.log('MGR MSG is a request to add a hunk')
          // pull the rest out,
          // unknown-len types return with return.item and return.increment
          inc++
          let strtype = MSGS.readFrom(msg, inc, 'string')
          inc += strtype.increment
          strtype = strtype.item
          // also might exist,
          let hnknm
          if (inc < msg.length && msg[inc] === HK.NAME) {
            inc ++
            hnknm = MSGS.readFrom(msg, inc, 'string')
            inc += hnknm.increment;
            hnknm = hnknm.item;
          }
          // might exist,
          let state
          if (inc < msg.length) {
            state = stateSetFromSerial(msg, inc)
            inc += state.increment
            state = state.item
            console.log('MGR to add', strtype, 'with state included:', state)
          } else {
            console.log('MGR to add', strtype)
          }
          // a meta comment is that this add promise doesn't fail for
          // things like path-loading errors, that would be inside of gogetter.js
          // i.e. pulling a hunk loads it into that import script hack, that just
          // gets evaluated into the dom ...
          this.addHunk(strtype, hnknm, state).then((hunk) => {
            console.log('successfully added hunk', hunk.name)
            // serialize
            resp.push(MK.HUNKALIVE)
            serializeHunk(hunk, resp)
            // ok then,
            idSafeReply(msgid, resp)
          }).catch((err) => {
            console.error('addhunk err', err)
            idSafeError(msgid, `cannot add this hunk ${err}`)
          })
          break
        case MK.REQNAMECHANGE:
          if (msgverbose) console.log('MGR MSG is a name change request')
          let nmchHnkInd = MSGS.readFrom(msg, inc + 1, 'uint16').item
          let nmchNewName = MSGS.readFrom(msg, inc + 4, 'string').item
          // not alot to this,
          try {
            hunks[nmchHnkInd].name = nmchNewName
            resp.push(MK.HUNKALIVE)
            serializeHunk(hunks[nmchHnkInd], resp)
            idSafeReply(msgid, resp)
          } catch (err) {
            console.error('name change error', err)
            idSafeError(msgid, `could not change this name ${err}`)
          }
          break
        case MK.REQSTATECHANGE:
          if (msgverbose) console.log('MGR MSG is a state change request')
          let stchHnkInd = MSGS.readFrom(msg, inc + 1, 'uint16').item
          let stchStInd = MSGS.readFrom(msg, inc + 4, 'uint8').item
          // to pull, we need to know the type at the end
          let stItem
          try {
            stItem = hunks[stchHnkInd].states[stchStInd]
          } catch (err) {
            idSafeError(msgid, 'probably bad state indexing here')
            console.error(err)
          }
          //console.log('stchange: would swap at', stItem)
          //console.log('stchange: with type', stItem.type)
          let stValRequest = MSGS.readFrom(msg, inc + 6, stItem.type).item
          //console.log('stchange: for value', stValRequest)
          stItem.tryChange(stValRequest, msgid)
          break
        case MK.REQRMHUNK:
          if (msgverbose) console.log('MGR MSG is a request to remove a hunk')
          let rmind = MSGS.readFrom(msg, inc + 1, 'uint16').item
          if (this.removeHunk(rmind)) {
            let rmconf = [MK.HUNKREMOVED]
            MSGS.writeTo(rmconf, rmind, 'uint16')
            idSafeReply(msgid, rmconf)
          } else {
            idSafeError(msgid, `failure to remove hunk ${rmind} as requested`)
          }
          break
        case MK.REQADDLINK:
          if (msgverbose) console.log('MGR MSG is a request to add a link')
          // these, and then draw links again ... and send links ?
          let arplySlice = inc + 1
          let addOutInd = MSGS.readFrom(msg, inc + 1, 'uint16').item
          let addOutputInt = MSGS.readFrom(msg, inc + 4, 'uint8').item
          let addInInd = MSGS.readFrom(msg, inc + 6, 'uint16').item
          let addInputInd = MSGS.readFrom(msg, inc + 9, 'uint8').item
          if (this.addLink(addOutInd, addOutputInt, addInInd, addInputInd)) {
            // identical arguments, so
            let reply = [MK.LINKALIVE].concat(msg.slice(arplySlice))
            idSafeReply(msgid, reply)
          } else {
            idSafeError(msgid, `failure to add link as requested`)
          }
          break
        case MK.REQRMLINK:
          if (msgverbose) console.log('MGR MSG is a request to remove a link')
          let rmrplySlice = inc + 1
          let rmOutInd = MSGS.readFrom(msg, inc + 1, 'uint16').item
          let rmOutputInt = MSGS.readFrom(msg, inc + 4, 'uint8').item
          let rmInInd = MSGS.readFrom(msg, inc + 6, 'uint16').item
          let rmInputInd = MSGS.readFrom(msg, inc + 9, 'uint8').item
          if (this.removeLink(rmOutInd, rmOutputInt, rmInInd, rmInputInd, true)) {
            // identical arguments, so
            let reply = [MK.LINKREMOVED].concat(msg.slice(rmrplySlice))
            idSafeReply(msgid, reply)
          } else {
            idSafeError(msgid, `failure to remove link as requested`)
          }
          break
        default:
          throw new Error(`manager receives message with no switch; ${msg}`)
          break
      }
    } // end msgs input

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

    // allow time, start at i = 1 so that we don't call out own loop, ourorbourousing ourselves to death
    for (let i = 1; i < hunks.length; i++) {
      hunks[i].loop()
    }

  } // end loop

  /* ---------------------------    ---------------------------- */
  /* --------------------- MESSAGES OUTPUT --------------------- */
  /* ---------------------------    ---------------------------- */

  let outmsgbuffer = new Array()

  let writeMessage = (bytes) => {
    if (this.isConnectedTo) {
      if (!msgsout.io() && outmsgbuffer.length < 1) {
        // str8 shooters
        if (msgverbose) this.log('msg out', bytes)
        msgsout.put(bytes)
      } else {
        // gotta buffer
        outmsgbuffer.push(bytes)
        if (msgverbose) this.log('MGR OUTBUFFER LEN', outmsgbuffer.length)
      }
    } else {
      console.log('mgr tossing message, for it hath not connected yet', bytes)
    }
  }

  let writeErrMessage = (message) => {
    // also log this for chrissake
    console.log('MANAGER ERRMSG', message)
    // only do this if the message is < 256b ?
    let msg = [MK.ERR]
    MSGS.writeTo(msg, message, 'string')
    writeMessage(msg)
  }
}

export default Manager
// file scraped from cuttlefish on Thu Mar 28 2019 10:38:28 GMT-0400 (Eastern Daylight Time)
