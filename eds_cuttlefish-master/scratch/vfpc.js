/*

very fast ~~picket ship~~ pipe transport

*/

import {
  Hunkify,
  Input,
  Output,
  State
} from '../hunks.js'

// DEPRICATED: RMing for pipe version, 

function VFP() {
  Hunkify(this)

  let debug = false

  let dtin = new Input('byteArray', 'data', this)
  this.inputs.push(dtin)

  let dtout = new Output('byteArray', 'data', this)
  this.outputs.push(dtout)

  // TODO is tackling state sets / updates / onupdate fn's
  // this is hunk -> manager commune ...
  let statusMessage = new State('string', 'status', 'closed')
  let retryCountHandle = new State('number', 'retrycount', 3)
  let resetRetryHandle = new State('boolean', 'retryreset', false)
  let addressState = new State('string', 'address', '127.0.0.1')
  let portState = new State('number', 'port', 2042)
  this.states.push(statusMessage, retryCountHandle, resetRetryHandle, addressState, portState)

  // this ws is a client,
  let ws = {}
  let url = 'ws://127.0.0.1:2020'
  this.outbuffer = new Array()

  this.init = () => {
    setTimeout(startWs, 500)
  }

  resetRetryHandle.onChange = (value) => {
    retryCountHandle.set(3)
    startWs()
    // to actually change the value, we would do:
    // resetRetryHandle.set(value)
  }

  let startWs = () => {
    // manager calls this once
    // it is loaded and state is updated (from program)
    url = 'ws://' + addressState.value + ':' + portState.value
    this.log(`attempt start ws at ${url}`)
    ws = new WebSocket(url)
    ws.binaryType = "arraybuffer"
    ws.onopen = (evt) => {
      this.log('ws opened')
      statusMessage.set('open')
    }
    ws.onerror = (evt) => {
      this.log('ws error, will reset to check')
      console.log('ws error:', evt)
      if(debug) console.log(evt)
      statusMessage.set('error')
      setCheck(500)
    }
    ws.onclose = (evt) => {
      this.log('ws close')
      setCheck(500)
    }
    ws.onmessage = (message) => {
      // this should be a buffer
      if(debug) console.log('WS receives', message.data)
      // tricks?
      // ok, message.data is a blob, we know it's str8 up bytes, want that
      // as an array
      let msgAsArray = new Uint8Array(message.data)
      // it's messy, yep!
      let msgAsStdArray = Array.from(msgAsArray)
      if(debug) console.log('WS receive, as an array:', msgAsArray);
      if (dtout.ie && this.outbuffer.length === 0) {
        dtout.put(msgAsStdArray)
      } else {
        this.outbuffer.push(msgAsStdArray)
      }
    }
    statusMessage.set('ws initialized...')
  }

  let checking = false

  let setCheck = (ms) => {
    if (checking) {
      // noop
    } else {
      setTimeout(checkWsStatus, ms)
      checking = true
    }
  }

  let checkWsStatus = () => {
    let retrycount = retryCountHandle.value - 1
    if (retrycount < 1) {
      // give up
      statusMessage.set('not connected')
      retryCountHandle.set(0)
      checking = false
    } else {
      retryCountHandle.set(retrycount)
      checking = false
      this.log('CHECKING STATUS')
      switch (ws.readyState) {
        case WebSocket.CONNECTING:
          this.log('ws is in process of connecting...')
          break
        case WebSocket.OPEN:
          this.log('is open')
          break
        case WebSocket.CLOSING:
          this.log('is closing')
          break
        case WebSocket.CLOSED:
          this.log('is closed, retrying ...')
          startWs()
          break
        default:
          throw new Error('nonsensical result at ws readystate check for ws')
          break
      }
    }
  }

  // override default change f'n
  retryCountHandle.onChange = (value) => {
    this.log('retrycount reset')
    retryCountHandle.set(value)
    setCheck(10)
  }

  this.loop = () => {
    // something like if(ws !== null && ws.isopen)
    // if we have an open port, and have bytes to send downstream,
    if (ws !== null && ws.readyState === 1) {
      // no buffering
      if (dtin.io()) {
        let arr = dtin.get()
        if(debug) console.log('WS transmission as array', arr)
        let bytesOut = Uint8Array.from(arr)
        // HERE insertion -> buffer.from() ?
        if(debug) console.log("WS sending buffer", bytesOut.buffer)
        ws.send(bytesOut.buffer)
      }
    }

    // check if we have outgoing to pass along
    if (this.outbuffer.length > 0 && !dtout.io()) {
      dtout.put(this.outbuffer.shift())
    }

  }
}

export default VFP
