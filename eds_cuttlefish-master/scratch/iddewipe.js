
// because lots of UI elements are call-and-response,
// I'm going to keep some top level values, and let them = null 
// when they are stateless
let svg, wrapper
let menu = {
    isLoaded: false,
    isLoading: false
}

// this runs once everything has loaded 
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
}

document.body.style.overflow = 'hidden'
document.body.style.transform = 'scale(1) translate(0px, 0px)'
document.body.style.transformOrigin = '0px 0px'

function elementIsNotModule(element) {
    if ((element.tagName == 'HTML') || (element.tagName == 'BODY') || (element.tagName == 'svg')) {
        return true
    } else {
        return false
    }
}

/* ---------------------------        ---------------------------- */
/* ------------------------- USER EVENTS ------------------------- */
/* ---------------------------        ---------------------------- */

/*
// don't appear to need this atm
// I believe it was here for right-clicking ... to ask for items 
let lastpos = { x: 0, y: 0 }

onmousemove = function(evt) {
    var cT = getCurrentTransform()
    lastpos.x = cT.ox - cT.tx + (evt.pageX - cT.ox) / cT.s
    lastpos.y = cT.oy - cT.ty + (evt.pageY - cT.oy) / cT.s
}
*/

onwheel = function(evt) {
    var el = document.elementFromPoint(evt.pageX, evt.pageY)
    if (elementIsNotModule(el)) {
        var cT = DT.getCurrentTransform()
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
        DT.writeTransformToPage(scale, [tx, ty], [evt.pageX, evt.pageY])
    }
}

onmousedown = function(evt) {
    // TODO: recall what does this do ?
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
    var cT = DT.getCurrentTransform()
    var dx = evt.movementX
    var dy = evt.movementY
    var tx = cT.tx + dx / cT.s
    var ty = cT.ty + dy / cT.s
    DT.writeTransformToPage(cT.s, [tx, ty])
}

function mouseUpDragListener(evt) {
    window.removeEventListener('mousemove', mouseMoveDragListener)
    window.removeEventListener('mouseup', mouseUpDragListener)
}

document.onkeydown = function(evt) {
    switch (evt.key) {
        case 'Escape':
        	// check ui stateful items ...
        	if(menu.isLoading === true || menu.isLoaded === true){
        		removeMenu() 
        	}
            // maybe we can have server/programs/program to load via url ? 
            /*
            setTimeout(() => {
                window.location.reload(true)
            }, 50)
            */
            break
        case 's':
            // get path ? 
            // save 
            var path = prompt("path? starting at atkapi/programs/")
            console.log('not yet saving')
            break
        default:
            break
    }
}

/* ------------------------- CONTEXT MENU ------------------------ */

let lastMenuPos = {
	x: 0,
	y: 0
}

// get json menu item and render
// and ask for module at /obj/key
oncontextmenu = function(evt) {
    // ok: if we were looking thru multiple contexts, we would pick via the target div
    // store the position to drop this back into
    // on some kind of callback 

    let ct = DT.getCurrentTransform()
    let pos = {}
    pos.x = ct.ox - ct.tx + (evt.clientX - ct.ox) / ct.s
    pos.y = ct.oy - ct.ty + (evt.clientY - ct.oy) / ct.s
    lastMenuPos = pos 
    requestHunksAvailable(pos)

    // false returns prevent event bubbling 
    return false

    /*
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
    */
}

/* ---------------------------        ---------------------------- */
/* -------------------------- MESSAGES --------------------------- */
/* ---------------------------        ---------------------------- */

// more like
let currentContext = Native 

function requestHunksAvailable(position) {
    // this becomes a message output, and input
    // TODO: this but in a message passing event system ... gah 
    currentContext.listHunksAvailable(onAvailableHunkItem)

    if (menu.isLoading === true || menu.isLoaded === true) {
        // TODO: we probably need to more carefully delete this thing
        // if it's already here 
        removeMenu()
    }

    menu.dom = document.createElement('div')
    menu.dom.id = 'contextmenu'
    menu.dom.style.left = position.x + 'px'
    menu.dom.style.top = position.y + 'px'
    let title = document.createElement('div')
    title.className = 'title'
    title.innerHTML = 'hunks available to add to *context*'
    menu.dom.appendChild(title)

    let loading = document.createElement('p')
    loading.id = 'loading'
    loading.innerHTML = '... loading ...'
    menu.dom.appendChild(loading)

    menu.isLoading = true
    wrapper.appendChild(menu.dom)
}

function onAvailableHunkItem(item) {
    // takes for granted that response is a list 
    // TODO: handle rejigging these loads / responses when you actually have 
    // a pipe into another context 
    if(item === 'finfinfin'){
    	menu.isLoading = false 
    	menu.isLoaded = true 
    	// flash, splash, pizzaz
    	$('#loading').remove()
    }

    if (menu.isLoading) {
    	let li = document.createElement('li')
    	li.innerHTML = item
    	li.addEventListener('click', (evt) => {
    		// make request to add this mdl 
    		menuSays('waiting for ' + li.innerHTML + ' ...')
    		// fer chrissake this is stateful as well 
    		currentContext.addHunk(li.innerHTML, onHunkAdded)
    	})
    	$('#loading').before(li)
    } else {
    	// err ? 
    }
}

function onHunkAdded(def){
	// received object is a 'definition' of the hunk
	console.log('hunk added, returns def', def)
	// we have the tools for this ... 
	// what we *will* want is to append this div to the local context

	let blkdiv = DT.writeDefDom(def, lastMenuPos)
	menu.dom.remove() 
	wrapper.appendChild(blkdiv)
}

function removeMenu() {
	menu.dom.remove()
	menu.dom = null 
    // and reset 
    menu.isLoading = false
    menu.isLoaded = false
}

function menuSays(string){
	$('#contextmenu').empty().append('<p>' + string + '</p>')	
}