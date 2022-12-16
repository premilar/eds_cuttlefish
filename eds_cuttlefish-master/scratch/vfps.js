/*

very fast ~~picket~~ physical transport

rip nautilus
long live the vfpt

thoughtless browser <-> serialport bridge

*/

// run at eval

var os = require('os');
var ifaces = os.networkInterfaces();

Object.keys(ifaces).forEach(function(ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function(iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log(ifname + ':' + alias, iface.address);
    } else {
      // this interface has only one ipv4 adress
      console.log(ifname, iface.address);
    }
    ++alias;
  });
});

// COBS https://github.com/tcr/node-cobs

function encode (buf, zeroBack) {
  var dest = [0];
  // vfpt starts @ 1,
  var code_ptr = 0;
  var code = 0x01;

  function finish (incllast) {
    dest[code_ptr] = code;
    code_ptr = dest.length;
    incllast !== false && dest.push(0x00);
    code = 0x01;
  }

  for (var i = 0; i < buf.length; i++) {
    if (buf[i] == 0) {
      finish();
    } else {
      dest.push(buf[i]);
      code += 1;
      if (code == 0xFF) {
        finish();
      }
    }
  }
  finish(false);

  if (zeroBack) {
    dest.push(0x00);
  }

  return new Buffer.from(dest);
}


function decode (buf)
{
  var dest = [];
  for (var i = 0; i < buf.length; ) {
    var code = buf[i++];
    for (var j = 1; j < code; j++) {
      dest.push(buf[i++]);
    }
    if (code < 0xFF && i < buf.length) {
      dest.push(0);
    }
  }
  return new Buffer.from(dest)
}

// wss, serport, etc
const WebSocketServer = require('ws').Server
const cobs = require('./cobs.js')
const SerialPort = require('serialport')
const Delimiter = require('@serialport/parser-delimiter')

let wsport = 2042
let WS = null
let pid = '8022'
let serport = null
let comname = ''

WSS = new WebSocketServer({
  port: wsport
})

WSS.on('connection', ((ws) => {
  console.log("ws connects")
  WS = ws
  WS.on('message', (buf) => {
    // this should be a buffer
    //console.log('WS receives: ', buf.length)
    // no additional cases yet, just
    if(serport){
      let op = encode(buf, true)
      //console.log("cobs -> ", op.length)
      serport.write(op, 'utf8')
    }
    /*
    switch(message[0]){
      case 0:
        // normal shit, cobs it onto the serial port
        console.log("cobs", encode(message, true))
        break;
      case 252:
        // the reset key
        break;
      default:
        // an error state
        console.log("ERR strange bytes at the VFPT, wyd?")
        break;
    }
    */
    // we dont' want to do anything here, just wrip the buffer -> cobs
  })
  WS.on('end', () => {
    this.log('WS CLOSED');
    status.set('closed')
  })
}))

let findSerialPort = () => {
  let found = false
  SerialPort.list((err, ports) => {
    ports.forEach((serialport) => {
      if (serialport.productId === pid) {
        comname = serialport.comName
        console.log(`found port at ${comname}, opening`)
        openPort()
      }
    })
  })
}

let openPort = () => {
  serport = new SerialPort(comname, {
    baudRate: 3000000
  })
  serport.on('open', () => {
    serport.on('error', (err) => {
      console.log('port error', err)
    })
    const parser = serport.pipe(new Delimiter({delimiter: [0]}))
    parser.on('data', (buf) => {
      // serialport doesn't guarantee packet sized events
      //console.log('serport receives: ', buf)
      let op = decode(buf)
      if(op[0] === 252){
        console.log('LLM: ', buf.toString('utf8'))
      } else {
        //console.log('<- de-cobs: ', op.length)
        if(WS){
          WS.send(op)
        }
      }
    })
  })
}

findSerialPort()

let reminders = () => {
  setImmediate(reminders)
}
reminders()
