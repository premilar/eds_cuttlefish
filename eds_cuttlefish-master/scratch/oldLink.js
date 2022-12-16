/*

line input

*/

// HEADER
import {
  Hunkify,
  Input,
  Output,
  State
} from './hunks.js'
// END HEADER

function Link() {
  Hunkify(this, 'Link')

  // data in/out
  // assumed that whatever is on the other end of bytes
  // does byte / packet level flowcontrol

  // links can be assumed to have data ports, these ferry byteArrays always ...
  this.inputs.data = new Input('byteArray', 'data')
  this.outputs.data = new Output('byteArray', 'data')

  // default, 0th ip and op are messages for managers
  this.state.inputList = new State('string', 'inputList', "msgs (byteArray)")
  this.state.outputList = new State('string', 'outputList', "msgs (byteArray)")

  // ip and op,
  let inports = [this.inputs.zero, this.inputs.one, this.inputs.two]
  let outports = [this.outputs.zero, this.outputs.one]
  
  // ok, on init look at state list

  // these are *special link inputs* keeping track of downstream status
  this.inputs.zero = new Input('any', 'zero')
  this.inputs.zero.dss = 'open'

  this.inputs.one = new Input('any', 'one')
  this.inputs.zero.dss = 'open'

  this.inputs.two = new Input('any', 'two')
  this.inputs.two.dss = 'open'


  // special outputs having upstream buffers
  this.outputs.zero = new Output('any', 'zero')
  this.outputs.zero.hold = {}
  this.outputs.zero.hold.status = 'open'
  this.outputs.zero.hold.msg = {}

  this.outputs.one = new Output('any', 'one')
  this.outputs.one.hold = {}
  this.outputs.one.hold.status = 'open'
  this.outputs.one.hold.msg = {}

  this.init = () => {
    // manager calls this once
    // it is loaded and state is updated (from program)
    this.log('hello Link')
    // HERE write those inputs via that list
  }

  // so far we won't ack at the link layer,
  // i.e. we will assume that we can send all ports across,
  // without getting an ack back from the link
  // but we will need to do this for the dmarippers
  // perhaps that should live in the layer that 'websocket' is at now


  let outbuffer = new Array()

  // I think we just need to buffer
  // the outputs that we pull but can't send

  /*
  let msg = {
      msg: content,
      port: portnum,
      isAck: false
  }
  // or
  let msg = {
      port: portnum,
      isAck: true
  }
  */

  // the link level will flow control across bytes,
  // so we just flow control across ports

  this.loop = () => {
    // for everything we're holding, check our outputs
    for (let i in outports) {
      if (outports[i].hold.status === 'occupied' && outports[i].ie) {
        // gr8 news, we can ship it
        outports[i].put(outports.hold.msg)
        outports[i].hold.status = 'clear'
        let ack = {
          isAck: true,
          port: i
        }
        outbuffer.push(ack)
      } else {
        // we can't do anything, waiting for outside world
      }
    }

    // then check for messages from the data link
    if (this.inputs.data.io()) {
      // we pull every time
      let msg = this.inputs.data.get()
      // if it's an ack, we can clear an input
      if (msg.isAck) {
        if (inports[msg.port].dss !== 'await ack') {
          console.log("LINK ERROR: ACK FROM NON WAIT")
          throw new Error('link panic', msg)
        } else {
          inports[msg.port].dss = 'open'
        }
      } else {
        // otherwise we have a message for one of our outputs
        let dsport = outports[msg.port]
        // if we have one
        if (dsport !== null && dsport !== undefined) {
          if (dsport.hold.status === 'occupied') {
            // bad news, we are already waiting to send
            // but we have this new thing, so
            console.log('LINK ERROR: 2ND MSG TO NON ACKED PORT')
            throw new Error('link panic', msg)
          } else if (dsport.ie) {
            // this is easy, we can just ship it
            dsport.put(msg.msg)
            let ack = {
              isAck: true,
              port: msg.port
            }
            outbuffer.push(ack)
          } else {
            // well, we already pulled it off stream, so
            dsport.hold.status = 'occupied'
            dsport.hold.msg = msg.msg
            // store it locally, but don't ack
            // so we should not get another message on this port until we ack ...
            // if we do, the 1st if statement in this block will be triggered
          }
        } else {
          console.log('LINK ERROR: RECEIVES MESSAGE FOR PORT IT DOTH NOT HAVE')
          console.log(msg.port, typeof msg.port)
          // TODO: make one, and report to manager that we have done so
        }
      } // end message-not-ack
    } // end if input has bytes

    // now let's run over our inputs,
    for (let i in inports) {
      // if there's a message on the input, and the downstream is clear,
      if (inports[i].io() && inports[i].dss === 'open') {
        // we can send it, and reset to await an ack
        this.log('i', typeof i)
        let dsmsg = {
          msg: inports[i].get(),
          port: parseInt(i),
          isAck: false,
        }
        this.log('LNK MSG OUT', dsmsg)
        inports[i].dss = 'await ack'
        outbuffer.push(dsmsg)
      } else {
        // otherwise, there's nothing we can do but let it sit there
      }
    }

    // flow control outgoing messages
    // one per loop !
    if (this.outputs.data.ie && outbuffer.length > 0) {
      this.outputs.data.put(outbuffer.shift())
    }
  } // end loop
}

// FOOTER
export default Link
// END FOOTER
