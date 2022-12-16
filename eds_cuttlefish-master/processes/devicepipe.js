/*
processes/devicepipe.js

establishes link to server-side devices, unix style 

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

const WebSocketServer = require('ws').Server
const fs = require('fs')

const STATUS_UNKNOWN = 'unknown...'
const STATUS_OPENING = 'opening...'
const STATUS_OPEN = 'open'
const STATUS_CLOSED = 'closed'
const STATUS_ERROR = 'error'

// port to issue on,
let port = '2042'
let deviceName = 'lp0'

const WSS = new WebSocketServer({port: port}, () => {
  if(process.send){ // check if we have a parent to send to
      process.send({
      startup: true,
      port: port
    })
  }
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
    if(typeof msg.data === 'string'){
      // probably a control object, do
      let data = JSON.parse(msg.data)
      if(data.type === 'echo'){
        sendToBrowser(msg.data)
      } else {
        console.log("how to handle:", data)
      }
    } else {
      if(Buffer.isBuffer(msg.data)){
        if(serport){
          serport.write(encode(msg.data, true), 'utf8')
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

// device business,

/*
So, right now (tired!) I'm trying to figure out how Neil writes commands to the Modelas... So far:
 - neil has 'command' and 'file' types: these look like just writing strings to the device
 - the path walks the segments, writes to strings, makes a big blob, sends that to the device server, OK
 - 'jog height' is some path-work built into the machine code... should be separate: path should *just* be move segments ...
 - serverside device server writes to the device at `dev/name` ... in a medium-odd loop, might take a minute to get this together.
*/

let findDevice = () => {
  // default: no real way to 'find' without some secondary usb library,
  // or: make a call to system lsusb ?
  let file = 'lp0'
  // the 'write' (w) flag is ~ important ~
  fs.open(`/dev/usb/${file}`, 'w', (err, fd) => {
    if(err){
      console.log(err)
    } else {
      // integers: 100 count in one mm, thx roland
      let hx = 1000
      let hz = 1000
      let hy = 1000
      let cm = `PA;PA;!PZ0,${hz};PU$${hx},${hy};!MC0;\u0004`
      console.log('attempt for', cm, 'to')
      console.log(fd)
      fs.write(fd, cm, (err, bytesWritten, buffer) => {
        if(err){
          console.log(err)
        } else {
          console.log('numBytesWritten', bytesWritten)
          console.log('buffer', buffer)
        }
      })
    }
  })
  /*
  fs.readdir('/dev/usb', (err, files) => {
    if(err){
      console.log(err)
    } else {
      console.log(files)
      for(file of files){
        if(file === deviceName){
          console.log('ok')
          // let's write to it...
          // first we have to open it...
          //
        }
      }
    }
  })
  */
}

let sendSerialStatus = () => {
  if(serport){
    if(serport.opening){
      sendToBrowser(JSON.stringify({
        type: 'serial status',
        status: STATUS_OPENING
      }))
    } else if (serport.readable){
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

findDevice()
