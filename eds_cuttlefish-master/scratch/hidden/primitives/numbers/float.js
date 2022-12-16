/*

line input

*/

const Hunk = require('../hunk.js')
let Hunkify = Hunk.Hunkify 
let Input = Hunk.Input 
let Output = Hunk.Output
let State = Hunk.State 

function Integer() {
    Hunkify(this, 'Integer')
    this.inputs.data = Input('any', 'data')
    this.outputs.integer = Output('integer', 'integer')
    this.outputs.notanumber = Output('event', 'notanumber')

    this.init = () => {
    	this.log('hello world')
    }

    this.addInput('another', 'anotherone')

    this.loop = () => {
        if (this.inputs.data.io() && this.outputs.integer.ie) {
            let output = parseInt(this.inputs.data.get())
            if (isNaN(output)) {
                this.outputs.notanumber.put(true)
                console.log('not a number')
            } else {
                this.outputs.integer.put(output)
            }
        }
    }
}

module.exports = Integer