//
//
// new node controller / VIEW 
// reconfigurable unviersal numeric dataflow machine controller
// 'RUN DMC'
// dataflow numeric controller
// OLD Depricated: used for !REF
// DNC 
//
// client.js
//
//
// Jake Read at the Center for Bits and Atoms
// (c) Massachusetts Institute of Technology 2018
//
// This work may be reproduced, modified, distributed, performed, and
// displayed for any purpose, but must acknowledge the mods
// project. Copyright is retained and must be preserved. The work is
// provided as is; no warranty is provided, and users accept all
// liability.

/*

CLIENT GLOBALS ---------------------------------------------------

*/

var sckt = {}
var lastPos = { x: 10, y: 30 }

// drawing / div-ing
var wrapper = {}
var nav = {}

var verbose = false
var verboseComs = false

/*

STARTUP ---------------------------------------------------

*/

window.onload = function() {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.position = 'absolute'
    svg.style.left = 0
    svg.style.top = 0
    svg.style.zIndex = 0
    svg.style.overflow = 'visible'
    svg.setAttribute('width', 2)
    svg.setAttribute('height', 2)
    svg.setAttribute('id', 'svg')
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    document.body.appendChild(svg)

    wrapper = document.createElement('div')
    wrapper.id = 'wrapper'
    document.body.append(wrapper)

    nav = document.getElementById('nav')

    const socket = new WebSocket('ws://localhost:8082')

    socket.onopen = function(evt) {
        // pass to global ref 
        sckt = this
        // say hello 
        socketSend('console', 'hello server')
        console.log('SCKT: socket open')
        // ask for the current program 
        socketSend('get current program', '')
        // main socket entry point
        this.onmessage = (evt) => {
            socketRecv(evt)
        }
        // others
        this.onerror = (err) => {
            alert('link to server is broken')
            location.reload()
            console.log('SCKT: socket error', err)
        }
        this.onclose = (evt) => {
            console.log('SCKT: socket closed', evt)
            sckt = null
        }
    }
}

/*

RECV / SEND PORTALS ---------------------------------------------------

*/

function socketSend(type, data) {
    var msg = {
        type: type,
        data: data
    }
    if (verboseComs) console.log('SEND', msg)
    sckt.send(JSON.stringify(msg))
}

function socketRecv(evt) {
    var recv = JSON.parse(evt.data)
    var type = recv.type
    var data = recv.data
    if (verboseComs) console.log('RECV', recv)
    // tree banger
    switch (type) {
        case 'console':
            console.log('RECV CONSOLE:', data)
            break
        case 'put module menu':
            if (verbose) console.log('RECV MODULE MENU')
            heapSendsModuleMenu(data)
            break
        case 'put program menu':
            if (verbose) console.log('RECV PRG MENU')
            heapSendsProgramMenu(data)
            break
        case 'put program':
            if (verbose) console.log('RECV PROGRAM')
            heapSendsNewProgram(data)
            break
        case 'put module':
            if (verbose) console.log('RECV NEW MODULE')
            heapSendsNewModule(data)
            break
        case 'put module change':
            if (verbose) console.log('RECV MODULE CHANGE')
            heapSendsModuleChange(data)
            break
        case 'put state change':
            if (verbose) console.log('RECV STATE CHANGE')
            heapSendsStateChange(data)
            break
        case 'put ui change':
            if (verbose) console.log('RECV UI CHANGE')
            heapSendsUiChange(data)
            break
        case 'restart':
            location.reload()
        default:
            console.log('ERR: recv with non recognized type', recv)
            break
    }
}

/*

MISC ---------------------------------------------------

*/


/*

HEAP -> SERVER ---------------------------------------------------

*/

// always a rep, tho
var program = {}

// re-writes t program, adds a description,
// and loads multiple representations of modules to the view 

function heapSendsNewProgram(prgm) {
    // whole hearted replace
    // hello for bugs when we lay this on top of something else 
    program = prgm
    if (program.description.view != null) {
        writeTransformToPage(program.description.view)
    }
    // 1st we want to git rm old files ... 
    // when adding links, we'll have to add all and then draw links
    if (verbose) console.log('LOAD PROGRAM', program)
    for (mdlName in program.modules) {
        addRepToView(program.modules[mdlName])
    }
    redrawLinks()
}

function heapSendsNewModule(mdl) {
    if (program.description == null) {
        program.description.name = 'unnamed program'
    }
    if (program.modules == null) {
        program.modules = {}
    }
    addRepToView(mdl)
    program.modules[mdl.description.id] = mdl
    redrawLinks()
}

// writes DOM elements to represent the module, appends to the wrapper
// and appends to the rep object a .dom object 
// containing references to those DOM objects 

function heapSendsModuleChange(data) {
    if (verbose) console.log('HEAP SENDS MODULE CHANGE', data)
    // data should be rep of changed module 
    var rep = program.modules[data.description.id]
    // we want a general case, but for now we know we're looking for 
    // new event hookups or new state items 
    for (key in rep.outputs) {
        var output = rep.outputs[key]
        if (output.calls.length !== data.outputs[key].calls.length) {
            rep.outputs = data.outputs
        }
    }
    // ok
    for (key in rep.state) {
        var stateItem = rep.state[key]
        if (stateItem != data.state[key]) {
            stateItem = data.state[key]
            rep.dom.state[key].value = data.state[key]
        }
    }
    // wreckless or wonderful?
    //clear(rep)
    redrawLinks()
}

// update state from server to UI
function heapSendsStateChange(data) {
    if (verbose) console.log('HEAP SENDS CHANGE STATE IN MODULE', data)
    var rep = program.modules[data.id]
    rep.state[data.key] = data.val
    if (typeof data.val == 'boolean') {
        rep.dom.state[data.key].innerHTML = data.key + ':\t\t' + rep.state[data.key].toString()
    } else {
        rep.dom.state[data.key].value = data.val
    }
}

function heapSendsUiChange(data) {
    if (verbose) console.log('HEAP SENDS MSG TO UI ELEMENT IN MDL', data)
    program.modules[data.id].ui[data.key].lump.onMessage(data.msg)
}

/*

UI -> HEAP ---------------------------------------------------

*/

// push new state from UI to server 
function putState(rep, key) {
    var data = {
        id: rep.description.id,
        key: key,
        val: rep.state[key]
    }
    socketSend('put state change', data)
}

// save ui position to server for reload
function putPosition(rep) {
    var data = {
        description: {
            id: rep.description.id,
            position: {
                left: rep.description.position.left,
                top: rep.description.position.top
            }
        }
    }

    socketSend('put position change', data)
}

// input / output click handling 
var clkState = false
var oClk = {}
var tmpBz = {}

function evtConnectHandler(clk) {
    if (!clkState) {
        // first click
        oClk = clk
        clkState = true
    } else {
        // second click
        var tClk = clk
        //console.log(oClk, tClk)
        var x1 = parseInt(oClk.evt.target.offsetParent.style.left, 10) + oClk.evt.target.offsetLeft + oClk.evt.target.clientWidth
        var y1 = parseInt(oClk.evt.target.offsetParent.style.top, 10) + oClk.evt.target.offsetTop + oClk.evt.target.clientHeight / 2
        var x2 = parseInt(tClk.evt.target.offsetParent.style.left, 10) + tClk.evt.target.offsetLeft
        var y2 = parseInt(tClk.evt.target.offsetParent.style.top, 10) + tClk.evt.target.offsetTop + tClk.evt.target.clientHeight / 2
        //var bz = newBezier(x1, y1, x2, y2)
        clkState = false
        //console.log('connect', oClk.rep.description.id, oClk.name, 'to', tClk.rep.description.id, tClk.name)
        var data = {
            from: {
                id: oClk.rep.description.id,
                output: oClk.name
            },
            to: {
                id: tClk.rep.description.id,
                input: tClk.name
            }
        }
        socketSend('put link change', data)
    }
}

/*

UTILITIES ---------------------------------------------------

*/

function redrawLinks() {
    // probably not a great way to do this, we're removing everything
    // svg -rm -r 
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild)
    }
    // draw origin 
    var og1 = newLine(-20, 0, 20, 0, 3, false)
    var og2 = newLine(0, -20, 0, 20, 3, false)
    // find that link
    var lnkPt
    var nLnk = 0
    for (mdlName in program.modules) {
        if (program.modules[mdlName].description.isLink) {
            lnkPt = getLeftWall(program.modules[mdlName].dom.domElem)
        }
    }
    // redraw thru all links, just look at reps
    for (mdlName in program.modules) {
        var mdlRep = program.modules[mdlName]
        for (key in mdlRep.outputs) {
            var output = mdlRep.outputs[key]
            var outputUi = mdlRep.dom.outputs[key]
            for (input in output.calls) {
                var toId = output.calls[input].parentId
                var toKey = output.calls[input].key
                var inputUi = program.modules[toId].dom.inputs[toKey]
                var outPos = getOutputArrow(outputUi)
                var inPos = getInputArrow(inputUi)
                if (inputUi.isHovering || outputUi.isHovering) {
                    var bz = newBezier(outPos.x, outPos.y, inPos.x, inPos.y, true)
                } else {
                    var bz = newBezier(outPos.x, outPos.y, inPos.x, inPos.y, false)
                }
            }
        }
        if (mdlRep.description.isHardware && !mdlRep.description.isLink) {
            nLnk++
            var hwPt = getRightWall(mdlRep.dom.domElem)
            lnkPt.y += 5 * nLnk
            var ln = newLine(hwPt.x, hwPt.y, lnkPt.x, lnkPt.y, 7, true)
        }
    }
}

/*

UI EVENTS ---------------------------------------------------------------------

*/

// drag / pan etc 

document.body.style.overflow = 'hidden'
document.body.style.transform = 'scale(1) translate(0px, 0px)'
document.body.style.transformOrigin = '0px 0px'
// s/o @ Neil 
function getCurrentTransform() {
    // a string 
    var transform = document.body.style.transform

    var index = transform.indexOf('scale')
    var left = transform.indexOf('(', index)
    var right = transform.indexOf(')', index)
    var s = parseFloat(transform.slice(left + 1, right))
    var index = transform.indexOf('translate')
    var left = transform.indexOf('(', index)
    var right = transform.indexOf('px', left)
    var tx = parseFloat(transform.slice(left + 1, right))
    var left = transform.indexOf(',', right)
    var right = transform.indexOf('px', left)
    var ty = parseFloat(transform.slice(left + 1, right))
    var origin = document.body.style.transformOrigin
    var pxx = origin.indexOf('px')
    var ox = parseFloat(origin.slice(0, pxx))
    var pxy = origin.indexOf('px', pxx + 2)
    var oy = parseFloat(origin.slice(pxx + 2, pxy))

    return ({
        s: s,
        tx: tx,
        ty: ty,
        ox: ox,
        oy: oy
    })
}

function writeTransformToPage(trns) {
    // console.log('writing transform', trns)
    /* transform is like {
        scale: number,
        translate: [x, y],
        origin: [x, y]
    }
    */
    document.body.style.transform = `scale(${trns.scale}) translate(${trns.translate[0]}px, ${trns.translate[1]}px)`
    document.body.style.transformOrigin = `${trns.origin[0]}px ${trns.origin[1]}px`
    // opposite for nav 
    nav.style.transformOrigin = `${trns.origin[0]}px ${trns.origin[1]}px`
    nav.style.transform = `scale(${1/trns.scale}) translate(${-trns.translate[0]*trns.scale}px,${-trns.translate[1]*trns.scale}px)`
}

function elementIsNotModule(element) {
    if ((element.tagName == 'HTML') || (element.tagName == 'BODY') || (element.tagName == 'svg')) {
        return true
    } else {
        return false
    }
}

onwheel = function(evt) {
    var el = document.elementFromPoint(evt.pageX, evt.pageY)
    if (elementIsNotModule(el)) {
        var cT = getCurrentTransform()
        evt.preventDefault()
        evt.stopPropagation()
        if (evt.deltaY > 0) {
            var scale = 1.05 * cT.s
        } else {
            var scale = 0.95 * cT.s
        }
        var tx = cT.tx + (evt.pageX - cT.ox) * (1 - 1 / cT.s)
        var ty = cT.ty + (evt.pageY - cT.oy) * (1 - 1 / cT.s)

        // body
        writeTransformToPage({
            scale: scale,
            translate: [tx, ty],
            origin: [evt.pageX, evt.pageY]
        })
        document.body.style.transform = `scale(${scale}) translate(${tx}px,${ty}px)`
        document.body.style.transformOrigin = `${evt.pageX}px ${evt.pageY}px`

        // opposite for nav 
        nav.style.transformOrigin = `${evt.pageX}px ${evt.pageY}px`
        nav.style.transform = `scale(${1/scale}) translate(${-tx*scale}px,${-ty*scale}px)`
    }
}

onmousedown = function(evt) {
    var qr = document.querySelector(':focus')
    if (qr) {
        qr.blur()
    }
    var el = document.elementFromPoint(evt.pageX, evt.pageY)
    if (elementIsNotModule(el)) {
        evt.preventDefault()
        evt.stopPropagation()
        window.addEventListener('mousemove', mouseMoveDragListener)
        window.addEventListener('mouseup', mouseUpDragListener)
    }
}

function mouseMoveDragListener(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    var cT = getCurrentTransform()
    var dx = evt.movementX
    var dy = evt.movementY
    var tx = cT.tx + dx / cT.s
    var ty = cT.ty + dy / cT.s

    // for body 
    document.body.style.transform = `scale(${cT.s}) translate(${tx}px,${ty}px)`

    // opposite for nav 
    nav.style.transform = `scale(${1/cT.s}) translate(${-tx*cT.s}px,${-ty*cT.s}px)`
}

function mouseUpDragListener(evt) {
    window.removeEventListener('mousemove', mouseMoveDragListener)
    window.removeEventListener('mouseup', mouseUpDragListener)
}

// get json menu item and render
// and ask for module at /obj/key
oncontextmenu = function(evt) {
    if (evt.target.className == 'modname') {
        var modRep = program.modules[evt.target.innerHTML]
        if (modRep) {
            writeModuleOptionMenu(modRep)
        }
    } else if (evt.target.tagName != 'HTML') {
        // clicked on something else 
    } else {
        if (sckt) {
            socketSend('get module menu', '')
        } else {
            // socket brkn, reload page 
            location.reload()
        }
        // prevents event bubbling 
    }
    return false
}

onmousemove = function(evt) {
    var cT = getCurrentTransform()
    lastPos.x = cT.ox - cT.tx + (evt.pageX - cT.ox) / cT.s
    lastPos.y = cT.oy - cT.ty + (evt.pageY - cT.oy) / cT.s
}

document.onkeydown = function(evt) {
    switch (evt.key) {
        case 'Escape':
            location.reload()
            break
        case 's':
            // get path ? 
            var path = prompt("path? starting at atkapi/programs/")
            socketSend('save program', path)
            break
        case 'l':
            socketSend('get program menu', '')
            break
        case 'm':
            socketSend('get module menu', '')
            break
        case 'd':
            console.log(program)
            break
        case 'k':
            socketSend('save program', 'temp')
        default:
            break
    }
}

function writeModuleOptionMenu(modRep) {
    var menuDom = document.createElement('div')
    menuDom.id = 'perModuleMenu'
    menuDom.style.left = 10 + modRep.dom.domElem.offsetLeft + modRep.dom.domElem.offsetWidth + 'px'
    menuDom.style.top = modRep.dom.domElem.offsetTop + 'px'
    // future: rm all inputs, rm all outputs, rename, open (heirarchy)
    var opts = ['delete', 'copy']
    for (i in opts) {
        var li = document.createElement('li')
        li.innerHTML = opts[i]
        li.id = opts[i]
        if (opts[i] == 'delete') {
            li.addEventListener('click', function(evt) {
                var data = {
                    id: modRep.description.id
                }
                socketSend('remove module', data)
                wrapper.removeChild(document.getElementById('perModuleMenu'))
            })
        } else if (opts[i] == 'copy') {
            li.addEventListener('click', function(evt) {
                var data = modRep.description.path
                socketSend('put module', data)
                wrapper.removeChild(document.getElementById('perModuleMenu'))
            })
        }
        menuDom.appendChild(li)
    }
    wrapper.append(menuDom)

    function rmListener(evt) {
        var findMenu = document.getElementById('perModuleMenu')
        if (findMenu != null && findMenu.id == 'perModuleMenu') {
            wrapper.removeChild(findMenu)
        }
        evt.target.removeEventListener(evt.type, arguments.callee)
    }

    document.addEventListener('click', rmListener)
}

// return ul element with name and alt and link? 
// TODO: not properly a tree, see note @ reciprocal fn in views.js
function heapSendsModuleMenu(tree) {
    var menuDom = document.createElement('div')
    menuDom.id = 'moduleMenu'
    menuDom.style.left = lastPos.x + 'px'
    menuDom.style.top = lastPos.y + 'px'
    var title = document.createElement('div')
    title.className = 'title'
    title.innerHTML = 'module menu'
    menuDom.appendChild(title)
    for (key in tree) {
        var ul = document.createElement('ul')
        ul.innerHTML = key.toString()
        for (subkey in tree[key]) {
            var li = document.createElement('li')
            var path = tree[key][subkey].path
            li.innerHTML = subkey.toString()
            li.id = path
            li.addEventListener('click', function(evt) {
                var data = this.id
                socketSend('put module', data)
                wrapper.removeChild(document.getElementById('moduleMenu'))
            })
            ul.appendChild(li)
        }
        menuDom.appendChild(ul)
    }
    wrapper.append(menuDom)

    function rmListener(evt) {
        var findMenu = document.getElementById('moduleMenu')
        if (findMenu !== null && findMenu.id == 'moduleMenu') {
            wrapper.removeChild(findMenu)
        }
        evt.target.removeEventListener(evt.type, arguments.callee)
    }

    document.addEventListener('click', rmListener)
}

function heapSendsProgramMenu(tree) {
    var menuDom = document.createElement('div')
    menuDom.id = 'programMenu'
    menuDom.style.left = lastPos.x + 'px'
    menuDom.style.top = lastPos.y + 'px'
    var title = document.createElement('div')
    title.className = 'title'
    title.innerHTML = 'program menu'
    menuDom.appendChild(title)
    for (key in tree) {
        var li = document.createElement('li')
        var path = tree[key].path
        li.innerHTML = key.toString()
        li.id = path
        li.addEventListener('click', function(evt) {
            var data = this.id
            socketSend('load program', data)
            wrapper.removeChild(document.getElementById('programMenu'))
        })
        menuDom.appendChild(li)
    }
    wrapper.append(menuDom)

    function rmListener(evt) {
        var findMenu = document.getElementById('programMenu')
        if (findMenu !== null && findMenu.id == 'programMenu') {
            wrapper.removeChild(findMenu)
        }
        // rm this listner... 
        evt.target.removeEventListener(evt.type, arguments.callee)
    }

    document.addEventListener('click', rmListener)
}