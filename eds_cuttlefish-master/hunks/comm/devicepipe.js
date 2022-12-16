/*
hunks/comm/devicepipe.js

pipe transport for an fs.write, appropriate for linux-2-machines, clientside

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

const STATUS_UNKNOWN = 'unknown...'
const STATUS_OPENING = 'opening...'
const STATUS_OPEN = 'open'
const STATUS_CLOSED = 'closed'
const STATUS_ERROR = 'error'

// catch this?
throw new Error('thou shalt not load this incomplete hunk')

// incomplete - *just* able to open pipe downstream,

export default function DevicePipe() {
  Hunkify(this)
  let debug = false

  let dtin = new Input('byteArray', 'data', this)
  this.inputs.push(dtin)

  let dtout = new Output('byteArray', 'data', this)
  this.outputs.push(dtout)

  // one pipe (websocket)
  let pipeStatusMessage = new State('string', 'pipe status', STATUS_CLOSED)
  let portSelect = new State('string', 'websocket port', '2042')
  let pipeRetryButton = new State('boolean', 'pipe reset', false)
  // and serialport,
  let serialStatusMessage = new State('string', 'serialport status', 'unknown')
  let usbPidSelect = new State('string', 'usb product id', '8022')

  let remoteProcessId = ''
  let shutdownRemote = () => {
    return new Promise((resolve, reject) => {
      jQuery.get(`/killProcess?pid=${remoteProcessId}`, (res) => {
        resolve()
      })
    })
  }

  this.states.push(pipeStatusMessage, portSelect, usbPidSelect, pipeRetryButton, serialStatusMessage)
  // for simplicity, joy, just reset everything ?
  pipeRetryButton.onChange = (value) => {
    shutdownRemote().then((res) => {
      startWsConnection()
    })
  }

  // coming merge of init and onload, however:
  this.init = () => {
    // force closed at startup; else program state can make us confused,
    pipeStatusMessage.set(STATUS_CLOSED)
    serialStatusMessage.set(STATUS_UNKNOWN)
    startWsConnection()
  }

  let ws = {}
  let outbuffer = []
  let startWsConnection = () => {
    // only attempt reconnect if we're not already opening, or opened
    if (pipeStatusMessage.value === STATUS_OPEN || pipeStatusMessage.value === STATUS_OPENING) return
    // ask the server to instantiate the reciprocal process,
    pipeStatusMessage.set(STATUS_OPENING)
    jQuery.get(`spawnProcess/devicepipe.js?args=${portSelect.value},${usbPidSelect.value}`, (data) => {
      if (data.startup) {
        console.log(`serverside launched with pid ${data.pid}, starting client`)
        remoteProcessId = data.pid
        console.log(data)
        // have data.ip and data.port
        ws = new WebSocket(`ws://${data.ip}:${data.port}`)
        ws.onopen = (evt) => {
          if (debug) console.log(this.name, 'opens')
          pipeStatusMessage.set(STATUS_OPEN)
        }
        ws.onerror = (err) => {
          if (debug) console.log(this.name, 'error', err)
          pipeStatusMessage.set(STATUS_ERROR)
        }
        ws.onclose = (evt) => {
          if (debug) console.log(this.name, 'closes')
          pipeStatusMessage.set(STATUS_CLOSED)
        }
        ws.onmessage = (msg) => {
          if (debug) console.log(this.name, 'recvs', msg)
          recv(msg)
        }
      } else {
        console.log('pipe received non-startup response from server')
        pipeStatusMessage.set(STATUS_ERROR)
      }
    })
  }

  // send wrapper
  let send = (msg) => {
    if (ws && ws.readyState === 1) {
      ws.send(msg)
      return true
    } else {
      console.error('attempt to send on a closed ws')
      return false
    }
  }

  // write ur handler,
  let recv = (msg) => {
    if(typeof msg.data === 'string'){
      let data = JSON.parse(msg.data)
      if(data.type === 'echo'){
        console.log('echo returns')
      } else if (data.type === 'serial status'){
        serialStatusMessage.set(data.status)
      } else {
        console.error('DevicePipe unhandled:', data)
      }
    } else {
      if(msg.data instanceof Blob){
        msg.data.arrayBuffer().then((res) => {
          outbuffer.push(Array.from(new Uint8Array(res)))
        }).catch((err) => {
          console.log("err converting recv'd blob into buffer", err)
        })
      } else {
        // bad error state
        console.error('bad data type out of VFPTS')
      }
    }
  }

  this.loop = () => {
    // if open downstream, take off of data input, push downstream
    if (ws && ws.readyState === 1) {
      if (dtin.io()) {
        ws.send(Uint8Array.from(dtin.get()).buffer)
      }
    }
    // if have recv'd msgs previously, and output clear, put 'em
    if (outbuffer.length > 0 && !dtout.io()) {
      let pusher = outbuffer.shift()
      if(debug) console.log('puts', pusher)
      dtout.put(pusher)//outbuffer.shift())
    }
  }

  // rm this
  this.onDelete = () => {
    // important to also shutdown remote process,
    // do: have reply come with pid,
    // on delete, send req to kill that pid ...
    if (ws && ws.readyState === 1) ws.close()
  }
}
