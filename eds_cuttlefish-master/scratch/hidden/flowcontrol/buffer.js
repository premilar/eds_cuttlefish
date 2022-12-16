/*

line input

*/

const Hunk = require('../hunk.js')
let Hunkify = Hunk.Hunkify 
let Input = Hunk.Input 
let Output = Hunk.Output
let State = Hunk.State 

function Reload() {
    Hunkify(this, 'Reload')

    this.inputs.item = Input('any', 'item')
    this.inputs.trigger = Input('trigger', 'reload')
    this.outputs.item = Output('any', 'item')

    let internal;

    this.loop = () => {
        // TODO: this requires some thought for flow-control ... 
        // it goes inline, I think, and reload is like const-buffering
        // also: we are doing this irresponsible thing of just dumping
        // to outputs without catching or checking ... 
        if(this.inputs.item.io()){
            internal = this.inputs.item.get()
            this.outputs.item.put(internal)
        }
        if(this.inputs.trigger.io()){
            // we have to clear this
            this.inputs.trigger.get() 
            this.outputs.item.put(internal)
        }
    }
}

module.exports = Reload