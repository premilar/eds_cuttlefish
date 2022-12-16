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

function ReadPNG() {
  // this fn attaches handles to our function-object,
  Hunkify(this)

  let imageOutput = new Output('rgba', 'image', this)
  let buttonOutput = new Output('string', 'button', this)
  this.outputs.push(imageOutput, buttonOutput)

  let xSize = new State('number', 'xSize', 400)
  let ySize = new State('number', 'ySize', 400)
  this.states.push(xSize, ySize)

  // State items also have change handlers,
  xSize.onChange = (value) => {
    // at this point, something external (probably a human)
    // has requested that we change this state variable,
    // we can reject that, by doing nothing here, or we can
    stateItem.set(value)
  }

  // hunks can choose to- or not- have init code.
  // at init, the module has been loaded and state variables have been
  // recalled from any program save - so this is a good point
  // to check any of those, and setup accordingly ...
  // as is tradition,
  this.dom = {}

  let button

  this.init = () => {
      // manager calls this once
      // it is loaded and state is updated (from program)
      console.log('HELLO Read PNG')
      this.dom = document.createElement('div')
      // 
  }

  this.onload = () => {
    let contact = $('<div>').addClass('btn').append('! read png !').get(0)
    $(this.dom).append(contact)
    contact.addEventListener('click', (evt) => {
        buttonOutput.put('anything')
    })
  }

  // to divide time between hunks, each has a loop function
  // this is the hunks' runtime: a manager calls this once-per-round
  // here is where we check inputs, put to outputs, do work, etc
  this.loop = () => {
    // typically we check inputs and outputs first,
    // making sure we are clear to run,
    /*
    if (inA.io() && !outB.io()) {
      // an input is occupied, and the exit path is empty
      let output = internalFunc(this.inputs.a.get())
      // put 'er there
      outB.put(output)
    }
    */
  }
}

// the hunk is also an ES6 module, this is how we export those:
export default ReadPNG
