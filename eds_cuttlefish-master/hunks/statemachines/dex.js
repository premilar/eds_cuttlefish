/*
hunks/statemachines/dex

purpose built statemachine for the https://gitlab.cba.mit.edu/jakeread/displacementexercise
aka DEX
aka king gripper
aka the big beefy boi
etc

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

/*

loadcell readings (for calibration)
0g: 25
100g: 14854
200g: 29649
300g: 44453
500g: 74061
700g: 103695

*/

// these are ES6 modules
import {
  Hunkify,
  Input,
  Output,
  State
} from '../hunks.js'

export default function DEX() {
  Hunkify(this)

  //let motorReturn = new Input('int32', 'motor return', this)
  let loadcellReturn = new Input('int32', 'loadcell return', this)
  this.inputs.push(loadcellReturn)

  // to operate,
  let motorOut = new Output('int32', 'motor output', this)
  let loadcellTrigger = new Output('boolean', 'loadcell trigger', this)
  this.outputs.push(motorOut, loadcellTrigger)
  // to run,
  let stressOut = new Output('number', 'current stress', this)
  let strainOut = new Output('number', 'current strain', this)
  this.outputs.push(stressOut, strainOut)

  let byIncrement = (count) => {
    return Math.round(count * umPerStep.value * 100) / 100
  }

  let shipIt = () => {
    motorOut.put(Math.round(incrementSize.value / umPerStep.value))
    loadcellTrigger.put(true)
  }

  // to config,
  let runState = new State('boolean', 'running', false)
  let resetState = new State('boolean', 'reset', false)
  // movement sizes info,
  let umPerStep = new State('number', 'displacement per step (um)', 4.23387)
  let incrementSize = new State('number', 'increment (um)', byIncrement(5))
  // loadcell info,
  let newtonsPerTick = new State('number', 'newtons per tick', )
  this.states.push(runState, umPerStep, incrementSize)
  // to run,
  let currentDisplacement = new State('number', 'current stress', 0)
  this.states.push(currentDisplacement)

  runState.onChange = (value) => {
    if (runState.value) {
      runState.set(false)
    } else {
      if(!loadcellTrigger.io()){
        shipIt()
        runState.set(true)
      } else {
        // nope, donot set
      }
    }
  }

  resetState.onChange = (value) => {
    currentDisplacement.set(0)
  }

  incrementSize.onChange = (value) => {
    let count = Math.ceil(value / umPerStep.value)
    incrementSize.set(byIncrement(count))
  }

  this.init = () => {
    // uh-uuuuh
    runState.set(false)
  }

  this.loop = () => {
    // clear in pairs,
    if(loadcellReturn.io()){
      let strain = loadcellReturn.get()
      currentDisplacement.set(currentDisplacement.value + incrementSize.value)
      if(!stressOut.io() && !strainOut.io()){
        stressOut.put(currentDisplacement.value)
        strainOut.put(strain)
      }
      if(runState.value){
        shipIt()
        // and

      }
    }
  }
}
