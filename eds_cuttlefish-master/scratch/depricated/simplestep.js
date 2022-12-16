// these are ES6 modules
import {
  Hunkify,
  Input,
  Output,
  State
} from '../hunks.js'

// a space-time jogging state machine for networked machines
// this is a husk, development continued in nautilus for return time reasons...
export default function SimpleStep() {
  // this fn attaches handles to our function-object,
  Hunkify(this)

  // ui,
  let pn = new Input('boolean', 'negPressure', this)
  let pp = new Input('boolean', 'posPressure', this)
  this.inputs.push(pn, pp)
  // handling (can we go num -> uint32 reliably at link?)
  let so = new Output('number', 'nextIncrement', this)
  //let oxi = new Input('number', 'xStepsMade', this)
  //this.inputs.push(oxi)
  this.outputs.push(so)

  let intervalOn = new State('boolean', 'intervalRunning', false)
  let incrementSize = new State('number', 'incrementSize', 10)
  this.states.push(intervalOn, incrementSize)

  let pressure = 0

  // donot startup running
  this.init = () => {
    intervalOn.set(false)
  }

  this.loop = () => {
    // pressure states
    if (pn.io()) {
      if (pn.get() === true) {
        pressure--
      } else {
        pressure++
      }
      //console.log('pn mod pressure', pressure)
    }
    if (pp.io()) {
      if (pp.get() === true) {
        pressure++
      } else {
        pressure--
      }
      //console.log('pp mod pressure', pressure)
    }
    // flow control should run this train all the way down,
    // so if there's room here we can send the next
    if (!so.io()) {
      if (intervalOn.value) {
        if (pressure < 0) {
          so.put(-incrementSize.value)
        } else if (pressure > 0) {
          so.put(incrementSize.value)
        } else {
          // zero
          so.put(0)
        }
      }
    }
  }
}
