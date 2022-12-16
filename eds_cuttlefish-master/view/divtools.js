/*
view/divtools.js

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import * as BZ from './vbzt.js'

// I forsee genuine instantiation and state here ...
// or a roll into view

let port

function init(dom, prt) {
    port = prt
    console.log('DT INIT with dom', dom, 'and port', port)
    BZ.init(dom)
}

/* ---------------------------        ---------------------------- */
/* ------------------------- TRANSFORMS -------------------------- */
/* ---------------------------        ---------------------------- */

function writeTransform(div, tf) {
    div.style.transform = `scale(${tf.s})`
    div.style.transformOrigin = '0px 0px'
    div.style.left = `${tf.x}px`
    div.style.top = `${tf.y}px`
}

function readTransform(div) {
    // a string (there must be a better way)
    let transform = div.style.transform

    let index = transform.indexOf('scale')
    let left = transform.indexOf('(', index)
    let right = transform.indexOf(')', index)
    let s = parseFloat(transform.slice(left + 1, right))

    let x = parseFloat(div.style.left)
    let y = parseFloat(div.style.top)

    return ({
        s: s,
        x: x,
        y: y
    })
}

function reposition(div){
    div.style.left = div.x + 'px'
    div.style.top = div.y + 'px'
}

function readXY(div){
    //console.log('READXY left', div.style.left, 'top', div.style.top)
    return {x: div.style.left, y: div.style.top}
}

/* ---------------------------        ---------------------------- */
/* -------------------- WRITING DOM ELEMENTS --------------------- */
/* ---------------------------        ---------------------------- */

function writeDefDom(def, parentdom, debug) {
    // debug
    if (debug) console.log('writing for def', def)
    // a div to locate it
    let de = document.createElement('div')
    $(de).addClass('block').attr('id', def.id)

    // more html: the title
    $(de).append($('<div>' + de.id + '</div>').addClass('blockid'))

    let title = $(de).children('.blockid').get(0)

    title.onmousedown = function(evt) {
        evt.preventDefault()
        evt.stopPropagation()

        // stop the D3 sim
        // halting ... we don't have access to that here
        // we need to roll this into view
        // save it for post-link world

        //offsetX = evt.clientX - domElem.getBoundingClientRect().left
        //offsetY = evt.clientY - domElem.getBoundingClientRect().top

        function domElemMouseMove(evt) {
            // TRANSFORMS here to move div about on drag
            evt.preventDefault()
            evt.stopPropagation()
            let ct = readTransform(de)
            ct.x += evt.movementX
            ct.y += evt.movementY
            writeTransform(de, ct)
            drawLinks(parentdom)
            // TODO rewrite redraw
            //redrawLinks()
        }

        function rmOnMouseUp(evt) {
            // would do save of position state here
            // TODO /\
            document.removeEventListener('mousemove', domElemMouseMove)
            document.removeEventListener('mouseup', rmOnMouseUp)
        }

        document.addEventListener('mousemove', domElemMouseMove)
        document.addEventListener('mouseup', rmOnMouseUp)
    }

    if (Object.keys(def.inputs).length > 0) {
        let idom = $('<div>').addClass('inputs')
        for (let key in def.inputs) {
            if (debug) console.log('def.inputs[key]', def.inputs[key])
            $(idom).append(writePortDom(def.inputs[key], def, 'input', parentdom, debug))
        }
        $(de).append(idom)
    }

    if (Object.keys(def.inputs).length > 0) {
        let odom = $('<div>').addClass('outputs')
        for (let key in def.outputs) {
            if (debug) console.log('def.outputs[key]', def.outputs[key])
            $(odom).append(writePortDom(def.outputs[key], def, 'output', parentdom, debug))
        }
        $(de).append(odom)
    }

    if (Object.keys(def.inputs).length > 0) {
        let sdom = $('<div>').addClass('state')
        for (let key in def.state) {
            if (debug) console.log('state dom', sdom)
            if (debug) console.log('def.state[key]', def.state[key])
            $(sdom).append(writeStateDom(def.state[key], def, debug))
        }
        $(de).append(sdom)
    }
    return de
}

// PORTS (inputs and outputs) are <li> objects with unique IDs,
// outputs hold a list of the unique id's they are connected to, for drawing
// beziers with
// we're close, just
/*
    - write message to manager
    - receive newlink messages from manager
    - something for deleting links ?
    - f it all and get to the link link
*/
function writePortDom(port, parent, inout, bigdom, debug) {
    if (false) console.log('port dom', port, parent.id, inout)
    let dom = $('<li>' + port.name + '</li>').addClass(inout).get(0)
    dom.id = parent.id + '_' + inout + '_' + port.name
    // this goes in so that we can handily draw links
    dom.connectedTo = new Array()
    // let ... in is OK for zero-length arrays, but for ... of throws errors
    for(let conn in port.connections){
        let cn = port.connections[conn]
        dom.connectedTo.push('#' + cn.parentid + '_' + 'input' + '_' + cn.input)
    }
    // messy global for the potential floater
    let floater = {}
    // the events
    function evtDrag(drag) {
        let cp = readTransform(floater)
        cp.x += drag.movementX
        cp.y += drag.movementY
        writeTransform(floater, cp)
        drawLinks(bigdom)
    }
    // startup the floater
    dom.addEventListener('mousedown', (down) => {
        console.log('MOUSEDOWN for', port.type, port.name, down)
        // get the location to make the floater,
        let cp = BZ.getRightHandle(dom, bigdom.subscale)
        floater = $('<div>').attr('id', 'floater').append(port.type).get(0)
        floater.style.zIndex = '1'
        bigdom.appendChild(floater)
        // 'hookup' our floater and its berth
        dom.connectedTo.push('#floater')
        // init out floater position, and put it in the dom
        writeTransform(floater, {
            s: bigdom.subscale,
            x: cp.x - 80 * bigdom.subscale,
            y: cp.y - (floater.clientHeight / 2) * bigdom.subscale
        })
        // do relative moves
        bigdom.addEventListener('mousemove', evtDrag)
        // and delete / act when mouse comes up
        bigdom.addEventListener('mouseup', function evtUp(up) {
            console.log('MOUSEUP ON', up.target.id)
            // recall name and parent id from id
            let str = up.target.id
            let last = str.lastIndexOf('_')
            let name = str.substring(last + 1)
            console.log('with name', name)
            let first = str.indexOf('_')
            let next = str.indexOf('_', first + 1)
            let id = str.substring(0, next)
            console.log('and id', id)
            let msg = {
                header: 'add link',
                content: [parent.id, port.name, id, name]
            }
            writeMsg(msg)
            // do things to conn, then
            // cleanup
            bigdom.removeEventListener('mouseup', evtUp)
            bigdom.removeEventListener('mousemove', evtDrag)
            dom.connectedTo.splice(dom.connectedTo.indexOf('#floater'), 1)
            $('#floater').remove()
            drawLinks(bigdom)
        })
    })
    if (debug) console.log('port', dom)
    return dom
}

function writeStateDom(state, parent) {
    let dom = $('<li>' + state.name + '</li>').get(0)
    switch (typeof state.value) {
        case 'string':
            let strinput = $('<input>').attr('type', 'text').attr('size', 24).attr('value', state.value).get(0)
            strinput.addEventListener('change', (evt) => {
                // ask for a change,
                writeStateChangeMessage(parent.id, state, strinput.value)
                // but assert that we don't change the definition unless
                strinput.value = state.value
            })
            state.dom = strinput
            $(dom).append(strinput)
            break

        case 'number':
            let ninput = $('<input>').attr('type', 'text').attr('size', 24).attr('value', state.value.toString()).get(0)
            ninput.addEventListener('change', (evt) => {
                // ask for a change,
                writeStateChangeMessage(parent.id, state, parseFloat(ninput.value))
                // but assert that we don't change the definition unless
                ninput.value = state.value
            })
            state.dom = ninput
            $(dom).append(ninput)
            break

        case 'boolean':
            $(dom).append('<span style="float:right;">' + state.value.toString() + '</span>')
            dom.addEventListener('click', (evt) => {
                // ask for a change,
                writeStateChangeMessage(parent.id, state, !state.value)
            })
            break

        default:

            // + note on nonrec type
            break
    }
    return dom
}


function writeStateChangeMessage(parentid, state, value) {
    let msg = {
        header: 'state change',
        content: {
            id: parentid,
            name: state.name,
            value: value
        }
    }
    writeMsg(msg)
}

function writeMsg(msg){
    console.log('div msg down', msg)
    console.log('port is', port)
    port(msg)
}

/* ---------------------------        ---------------------------- */
/* ----------------------- RENDERING LINKS ----------------------- */
/* ---------------------------        ---------------------------- */

function drawLinks(dom) {
    // from within the div
    let outputs = $(dom).children('.block').children('.outputs').children('.output')
    // clear all links
    BZ.clear(dom)
    // and draw new ones
    for (let output of outputs) {
        // finding the children to hookup to
        for(let conn in output.connectedTo){
            let hookup = $(dom).find(output.connectedTo[conn])
            if(hookup.length !== 1){
                // this can happen when a dependent is not loaded yet
                console.log('missing connection')
            } else {
                let hk = hookup.get(0)
                let head = BZ.getRightHandle(output, dom.subscale)
                let tail
                if(hk.id === 'floater'){
                    tail = BZ.getFloaterHandle(hk, dom.subscale)
                } else {
                    tail = BZ.getLeftHandle(hk, dom.subscale)
                }
                BZ.writeBezier(head, tail, output.id + hk.id, dom)
            }
        }
    }
}

export {
    init,
    readTransform,
    readXY,
    reposition,
    writeTransform,
    writeDefDom,
    drawLinks
}
