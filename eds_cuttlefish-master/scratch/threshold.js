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

function Threshold() {
  // this fn attaches handles to our function-object,
  Hunkify(this)

  // inputs, outputs, and state are objects. they have a type (string identifier)
  // see 'typeset.js'
  // a name (doesn't have to be unique), and we pass them a handle to ourselves...
  let inputImage = new Input('rgba', 'image', this)
  let buttonInput = new Input('string', 'button', this)
  // inputs, outputs and state are all keps locally in these arrays,
  // if we don't include them here, the manager will have a hard time finding them ...
  this.inputs.push(inputImage, buttonInput)

  let outputImage = new Output('rgba', 'image', this)
  this.outputs.push(outputImage)

  let threshold = new State('number', 'threshold', 0.5)
  this.states.push(threshold)

  // State items also have change handlers,
  threshold.onChange = (value) => {
    // at this point, something external (probably a human)
    // has requested that we change this state variable,
    // we can reject that, by doing nothing here, or we can
    threshold.set(value)
  }

  this.dom = {}

  // hunks can choose to- or not- have init code.
  // at init, the module has been loaded and state variables have been
  // recalled from any program save - so this is a good point
  // to check any of those, and setup accordingly ...
  this.init = () => {
    this.log('hello threshold')
    this.dom = $('<div>').get(0)
  }

  let text = {}
  this.onload = () => {
    text = $('<div>').addClass('txt').append('---').get(0)
    $(this.dom).append(text)
  }

  // to divide time between hunks, each has a loop function
  // this is the hunks' runtime: a manager calls this once-per-round
  // here is where we check inputs, put to outputs, do work, etc
  this.loop = () => {
    // typically we check inputs and outputs first,
    // making sure we are clear to run,
    if (inputImage.io() && !outputImage.io()) {
      // an input is occupied, and the exit path is empty
      // do stuff..,
    }
    // or,
    if (buttonInput.io()){
      let data = buttonInput.get()
      console.log('... button gets', data)
      $(text).html(data)
    }
  }
}

// the hunk is also an ES6 module, this is how we export those:
export default Threshold
