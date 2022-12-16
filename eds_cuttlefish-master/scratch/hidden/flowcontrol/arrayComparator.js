/*

line input

*/

const Hunk = require('../hunk.js')
let Hunkify = Hunk.Hunkify 
let Input = Hunk.Input 
let Output = Hunk.Output
let State = Hunk.State 

function ArrayComparator() {
    Hunkify(this, 'ArrayComparator')

    this.inputs.a = Input('array', 'compare-to')
    this.inputs.b = Input('array', 'compare-with')
    this.outputs.c = Output('event', 'compares-true')

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
        if(this.inputs.a.io() && this.inputs.b.io() && this.outputs.c.ie){
            // we are all clear 2 compute 
            // check by length first
            let a = this.inputs.a.get()
            let b = this.inputs.b.get() 
            let ok = true 
            if(a.length === b.length){
                for(let i = 0; i < a.length; i ++){
                    if(a[i] !== b[i]){
                        ok = false
                    }
                }
            } else {
                ok = false 
            }
            if(ok){
                this.log('OKOKOK')
                this.outputs.c.put(true)
            } else {
                this.log('NONONO')
                console.log(a)
                console.log(b)
            }
        }
    }
}

module.exports = ArrayComparator