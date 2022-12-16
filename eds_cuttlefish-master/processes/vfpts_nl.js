/*
processes/vfpts_nl.js

very fast ~~picket ship~~ pipe transport (server)

adhoc for architecture section, do newline delimiter

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

const WebSocketServer = require('ws').Server
const SerialPort = require('serialport')
const Delimiter = require('@serialport/parser-delimiter')

const STATUS_UNKNOWN = 'unknown...'
const STATUS_OPENING = 'opening...'
const STATUS_OPEN = 'open'
const STATUS_CLOSED = 'closed'
const STATUS_ERROR = 'error'

// port to issue on,
let port = '2042'
let pid = '6001'

const WSS = new WebSocketServer({ port: port }, () => {
  process.send({
    startup: true,
    port: port
  })
})

let WS = null

WSS.on('connection', (ws) => {
  console.log('vfpts websocket connects')
  // handles,
  WS = ws
  // send current status
  sendSerialStatus()
  // handlers,
  ws.onmessage = (msg) => {
    if (typeof msg.data === 'string') {
      // probably a control object, do
      let data = JSON.parse(msg.data)
      if (data.type === 'echo') {
        sendToBrowser(msg.data)
      } else {
        console.log("how to handle:", data)
      }
    } else {
      if (Buffer.isBuffer(msg.data)) {
        if (serport) {
          serport.write(msg.data, 'utf8')
        }
      }
    }
  }
  ws.onclose = (evt) => {
    // shutdown,
    console.log('ws closes, pipe exiting')
    process.exit()
  }
})

// send wrapper
let sendToBrowser = (msg) => {
  if (WS) {
    WS.send(msg)
    return true
  } else {
    return false
  }
}

// now the usb,
let serport = null
let comname = ''

let sendSerialStatus = () => {
  if (serport) {
    if (serport.opening) {
      sendToBrowser(JSON.stringify({
        type: 'serial status',
        status: STATUS_OPENING
      }))
    } else if (serport.readable) {
      sendToBrowser(JSON.stringify({
        type: 'serial status',
        status: STATUS_OPEN
      }))
    } else {
      sendToBrowser(JSON.stringify({
        type: 'serial status',
        status: STATUS_CLOSED
      }))
    }
  } else {
    sendToBrowser(JSON.stringify({
      type: 'serial status',
      status: STATUS_CLOSED
    }))
  }
}

let findSerialPort = () => {
  let found = false

  SerialPort.list().then((ports) => {
    ports.forEach((serialport) => {
      console.log('computer has port:', serialport.path, 'pid:', serialport.productId)
      //console.log(serialport)
      if (serialport.productId === pid) {
        comname = serialport.path
        console.log(`found target port at ${comname}, opening`)
        openPort()
      }
    })
  }).catch((err) => {
    console.log('err while looking for serialports', err)
    sendToBrowser(JSON.stringify({
      type: 'serial status',
      status: STATUS_CLOSED
    }))
  })
}

let openPort = () => {
  serport = new SerialPort(comname, {
    baudRate: 9600
  })
  serport.on('open', () => {
    console.log('port is open')
    sendSerialStatus()
    serport.on('error', (err) => {
      sendSerialStatus()
      console.log('port error', err)
    })
    const parser = serport.pipe(new Delimiter({ delimiter: '\n' }))
    parser.on('data', (buf) => {
      console.log('sp: ', buf)
      // serialport doesn't guarantee packet sized events
      if (WS) {
        WS.send(buf)
      }
    })
  })
}

findSerialPort()

// this causes node to req. time from the OS more often (as often as possible)
// meaning that our events are handled more often, and we drop ring times by some ms
// does burn cycles though,

let reminders = () => {
  setImmediate(reminders)
}
reminders()
