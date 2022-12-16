/*
hunks/drink_mixer.js

example of ahn hunk

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// steps per unit: 30
// current: 10
// acc: 5 u/s/s
// speed: 25 u/s

// these are ES6 modules
import {
  Hunkify,
  Input,
  Output,
  State
} from './hunks.js'

// our function name actually doesn't matter: hunks in js are named by their
// location on disk
export default function Name() {
  // this fn attaches handles to our function-object,
  Hunkify(this)

  // inputs, outputs, and state are objects.
  // they each have a type and a name


  // pumpState output -> microcontroller input
  let pumpState = this.output('int32', 'pumpState', 0);

  // stepperPosition output -> saturn posn input 
  let stepperPosition = this.output('array', 'stepperPosition', 0);

  // duration of move and pour
  let delayInMillisecondsMove = this.state('int32', 'Move Duration (ms)', 3000);
  delayInMillisecondsMove.onChange = (value) => {
    console.log('New Move Duration:', value)
    delayInMillisecondsMove.set(value)
  }

  let delayInMillisecondsPour = this.state('int32', 'Pour Durations (ms)', 5000);
  delayInMillisecondsPour.onChange = (value) => {
    console.log('New Pour Duration:', value)
    delayInMillisecondsPour.set(value)
  }

  // states take another argument: their default startup value
  // let stateItem = this.state('int32', 'exclaim', '!')

  // State items also have change handlers,
  // stateItem.onChange = (value) => {
  //   // at this point, a request to update this state item to the provided value
  //   // has been made
  //   console.log('requests:', value)
  //   // we can reject that, by doing nothing here, or we can
  //   stateItem.set(value)
  //   // or compute on it, set limits, etc
  // }

  // hunks can choose to- or not- have init code.
  // at init, the module has been loaded into the JS engine and state variables have been
  // recalled from any program save - so this is a good point
  // to check any of those, and setup accordingly ...
  this.init = () => {
    this.log('hello drinking machine')
  }

  // there are no rules within this closure, local functions, data, etc...
  // let internalVariable = 'local globals'
  // function internalFunc(str) {
  //   let caps = str.toUpperCase()
  //   caps += stateItem.value
  //   return (caps)
  // }

  /* Drinks:
   - 1: Lemonade
   - 2: Strawberry
   - 3: Grape Juice
   - 4: Blue Raspberry
  */
  const dictDrinks = { //apparently you can't have integer keys
    '0': [0], // a state to reset everything
    '1': [1,5], // lemonade
    '2': [2,5], // strawberry juice
    '3': [3,5], // grape juice
    '4': [4,5], // blue raspberry juice
    '5': [1,2,5], // strawberry lemonade
    '6': [1,3,5], // grape lemonade
    '7': [1,4,5], // green monster
    '8': [2,3,5], // grape strawberry
    '9': [2,4,5], // blue strawberry
    '10': [3,4,5], // blue grape juice
    '11': [1,2,3,5], // yuck
    '12': [1,2,4,5], // don't drink this
    '13': [1,3,4,5], // come on why
    '14': [2,3,4,5], // this isn't very good
    '15': [1,2,3,4,5], // why would you do this to yourself
    '16': [1,4,4,5], // greener monster
    '17': [4,2,3,3,1,2,1,4,5] // a bunch of everything
  };

  const dictPositions = { // Pass an array to Saturn
    '0': [0,0,0],  // far left
    '1': [0,0,0], // under first pump
    '2': [350,0,0], // under second pump
    '3': [700,0,0], // under third pump
    '4': [1050,0,0], // under fourth pump
    '5': [0,0,0],// far right
  };

  const states = {
    IDLE: 0,
    GET_NEXT_ITEM: 1,
    MOVE_STEPPER: 2,
    MOVE_DELAY: 3,
    POUR_DRINK: 4,
    POUR_DELAY: 5
  };


  let drinkList = [];

  let state = states.IDLE;

  let currentIngredient = 0;


  this.dom = {}

  this.init = () => {
      // manager calls this once
      this.dom = $('<div></div>').get(0)
  }

  this.onload = (dom) => {
    // function equivalent, our .dom element is loaded into ~ the d o m ~
    let list = $('<select>').get(0);
    const pairList = [
      [0, 'Reset'],
      [1, 'Lemonade'],
      [2, 'Strawberry Juice'],
      [3, 'Grape Juice'],
      [4, 'Blue Raspberry Juice'],
      [5, 'Strawberry Lemonade'],
      [6, 'Grape Lemonade'],
      [7, 'Green Monster'],
      [8, 'Red Violet Delish'],
      [9, 'Purple Drank'],
      [10, 'Blue Grape Juice'],
      [11, 'LSG'],
      [12, 'LSB'],
      [13, 'LGB'],
      [14, 'SGB'],
      [15, 'A bit of everything'],
      [16, 'Greener Monster'],
      [17, 'A bunch of everything']
    ];
    for(let [i, name] of pairList){
      let option = $('<option value="' + i + '">' + name + '</option>').get(0);
      $(list).append(option)
    }
    $(this.dom).append(list);
    let pressme = $('<div>').addClass('btn').append('Make a drink for me').get(0)
    $(this.dom).append(pressme);
    pressme.addEventListener('click', (evt) => {
      let value = parseInt(list.value) || 0;

      if(pumpState.io()){
        console.warn("The barman is busy, sorry")
      } else {
        // logic for making that drink!
        if (state == states.IDLE){
          console.log('Making drink #' + value + ' = ' + (pairList[value] || 'unknown'));
          drinkList = dictDrinks[value]; // but js will convert the int (value) to a string
          currentIngredient = 0;
          state = states.GET_NEXT_ITEM;
          console.log("This is our recipe " + drinkList + " of length " + drinkList.length);
        } else {
          console.warn("The barman is busy, sorry")
        }
      }
    })
  }

  let curMove = dictPositions['0'];
  let curPour = drinkList['0'];

  // to divide time between hunks, each has a loop function
  // this is the hunks' runtime, and is called repeatedly, as the process runs
  // here is where we check inputs, put to outputs, do work, etc
  this.loop = () => {
    switch(state){
      case states.IDLE:
        // do nothing while idling
        break;

      case states.GET_NEXT_ITEM:
        // check to see if there's anything left to grab
        if (currentIngredient >= drinkList.length){ // nothing left to do!
          state = states.IDLE;
          console.log("Drink Complete");
          break;
        }
        // pull the next drink
        let oldMove = curMove; // check previous move to see if we've done it already
        curMove = dictPositions[drinkList[currentIngredient]];
        curPour = drinkList[currentIngredient];
        console.log("Preparing ingredient " + currentIngredient);
        currentIngredient++;
        if (oldMove == curMove) { // if we've already moved the stepper here, don't do it again
          state = states.POUR_DRINK;
          break;
        }
        state = states.MOVE_STEPPER;
        break;

      case states.MOVE_STEPPER:
        stepperPosition.put(curMove); // move the stepper
        console.log("Moving to " + curMove);
        setTimeout(function() { // after 3 seconds, switch to pour state
          state = states.POUR_DRINK;
        }, delayInMillisecondsMove.value);
        state = states.MOVE_DELAY;
        break;

      case states.MOVE_DELAY:
        // do nothing while waiting for move to complete
        break;

      case states.POUR_DRINK:
        if (curPour == 5){ // don't pour if we're at the end
          state = states.IDLE;
          console.log("At the end, no pour");
          break;
        }
        console.log("Pouring " + curPour);
        pumpState.put(curPour);
        if (curPour == 0){ // there's nothing to pour
          state = states.GET_NEXT_ITEM;
          break;
        }
        setTimeout(function() { // after 30 seconds, switch to get 
          pumpState.put(0); // stop pouring after complete
          state = states.GET_NEXT_ITEM;
        }, delayInMillisecondsPour.value);
        state = states.POUR_DELAY;
        break;

      case states.POUR_DELAY:
        // do nothing while waiting for pour to complete
        break;
    }
    // typically we check inputs and outputs first,
    // making sure we are clear to run,
    // if (inA.io() && !outB.io()) {
    //   // an input is occupied, and the exit path is empty
    //   let output = internalFunc(inA.get())
    //   // put 'er there
    //   outB.put(output)
    // }
  }
}
