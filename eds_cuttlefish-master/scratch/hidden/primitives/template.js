/*

line input

*/

const Hunk = require('../hunk.js')
let Hunkify = Hunk.Hunkify 
let Input = Hunk.Input 
let Output = Hunk.Output
let State = Hunk.State 

function Name() {
    Hunkify(this, 'Name')

    this.inputs.a = Input('type', 'name')
    this.outputs.b = Output('type', 'name')
    this.states.item = State('type', 'name')

    this.init = () => {
        // manager calls this once 
        // it is loaded and state is updated (from program)
        this.log('hello world')
    }

    function internalFunc(data){
        // scoped function, not accessible externally
    }

    let internalVariable = 'local globals'

    this.loop = () => {
        // this will be called once every round turn 
        // typically we check flow control first
        if(this.inputs.a.io() && this.outputs.b.ie){
            // an input is occupied, and the exit path is empty 
            let output = internalFunc(this.inputs.a.get())
            this.outputs.b.put(output)
        }
    }
}

module.exports = Name