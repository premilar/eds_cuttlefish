/*

hunk template

*/

// these are ES6 modules
import {
  Hunkify,
  Input,
  Output,
  State
} from '../hunks.js'

// a space-time jogging state machine for networked machines
// this is a husk, development continued in nautilus for return time reasons...
function USSM() {
  // this fn attaches handles to our function-object,
  Hunkify(this)

  let lmReturn = new Input('int32', 'lmReturn', this)
  let rmReturn = new Input('int32', 'rmReturn', this)
  let rdReturn = new Input('int32', 'rdReturn', this)
  this.inputs.push(lmReturn, rmReturn, rdReturn)

  let lmOut = new Output('int32', 'lmOut', this)
  let rmOut = new Output('int32', 'rmOut', this)
  let rdTrig = new Output('boolean', 'rdTrig', this)
  this.outputs.push(lmOut, rmOut, rdTrig)

  // that hot hot action
  let shipIt = () => {
    let inc = sInc.value
    lmOut.put(inc)
    rmOut.put(inc)
    rdTrig.put(true)
    runSequence.set(true)
  }

  // global trigger
  let runSequence = new State('boolean', 'runSequence', false)
  let sInc = new State('number', 'stepIncrement', 1)
  this.states.push(runSequence, sInc)
  runSequence.onChange = (value) => {
    //console.log("USSM trig req")
    if(runSequence.value){
      // shutdown and
      runSequence.set(false)
    } else {
      if(!(lmOut.io()) && !(rmOut.io()) && !(rdTrig.io())){
        shipIt()
      } else {
        console.warn('on ussm seq. start, outputs not clear')
        runSequence.set(false)
      }
    }
  } // end runseq. change

  // hunks can choose to- or not- have init code.
  // at init, the module has been loaded and state variables have been
  // recalled from any program save - so this is a good point
  // to check any of those, and setup accordingly ...
  this.init = () => {
    this.log('USSM init')
  }

  this.loop = () => {
    // we should expect all to return before we push new outputs
    if(lmReturn.io() && rmReturn.io() && rdReturn.io()){
      lmReturn.get()
      rmReturn.get()
      rdReturn.get()
      if(runSequence.value){
        shipIt()
      } else {
        // noop
      }
    }
  }
}

// the hunk is also an ES6 module, this is how we export those:
export default USSM
