/* ---------------------------        ---------------------------- */
/* ----------------------- DRAWING BEZIERS ----------------------- */
/* ---------------------------        ---------------------------- */

var svgns = 'http://www.w3.org/2000/svg'
var svg = {}

function newBezier(x1, y1, x2, y2, highlight) {
    var bz = {}
    bz.elem = document.createElementNS(svgns, 'path')
    if (highlight) {
        bz.elem.style.stroke = '#fcd17b'
    } else {
        bz.elem.style.stroke = '#1a1a1a'
    }
    bz.elem.style.fill = 'none'
    bz.elem.style.strokeWidth = '7px'
    bz.x1 = x1
    bz.y1 = y1
    bz.x2 = x2
    bz.y2 = y2
    redrawBezier(bz)
    svg.appendChild(bz.elem)
    return bz
}

function redrawBezier(bz) {
    var bl = Math.sqrt(Math.pow((bz.x1 - bz.x2), 2) + Math.pow((bz.y1 - bz.y2), 2)) * 0.6
    var ps = 'M ' + bz.x1 + ' ' + bz.y1 + ' C ' + (bz.x1 + bl) + ' ' + bz.y1
    var pe = ' ' + (bz.x2 - bl) + ' ' + bz.y2 + ' ' + bz.x2 + ' ' + bz.y2
    bz.elem.setAttribute('d', ps + pe)
}

function modifyBezierHead(bz, x1, y1) {
    bz.x1 = x1
    bz.y1 = y1
    redrawBezier(bz)
}

function modifyBezierTail(bz, x2, y2) {
    bz.x2 = x2
    bz.y2 = y2
    redrawBezier(bz)
}

function getOutputArrow(div) {
    var x = div.offsetParent.offsetLeft + div.offsetLeft + div.clientWidth
    var y = div.offsetParent.offsetTop + div.offsetTop + div.clientHeight / 2
    var pos = {
        x: x,
        y: y
    }

    return pos
}

function getInputArrow(div) {
    var x = div.offsetParent.offsetLeft
    var y = div.offsetParent.offsetTop + div.offsetTop + div.clientHeight / 2
    var pos = {
        x: x,
        y: y
    }

    return pos
}

function newLine(x1, y1, x2, y2, stroke, dashed) {
    var ln = {}
    ln.elem = document.createElementNS(svgns, 'line')
    ln.elem.style.stroke = '#1a1a1a'
    if (dashed) {
        ln.elem.setAttribute('stroke-dasharray', '21, 7, 7, 7')
    }
    ln.elem.style.fill = 'none'
    if (stroke) {
        ln.elem.style.strokeWidth = stroke + 'px'
    } else {
        ln.elem.style.strokeWidth = '6px'
    }
    ln.x1 = x1
    ln.y1 = y1
    ln.x2 = x2
    ln.y2 = y2
    redrawLine(ln)
    svg.appendChild(ln.elem)
    return ln
}

function redrawLine(ln) {
    ln.elem.setAttribute('x1', ln.x1)
    ln.elem.setAttribute('y1', ln.y1)
    ln.elem.setAttribute('x2', ln.x2)
    ln.elem.setAttribute('y2', ln.y2)
}

function getLeftWall(div) {
    var x = div.offsetLeft + 25
    var y = div.offsetTop + 25
    var pt = {
        x: x,
        y: y
    }
    return pt
}

function getRightWall(div) {
    var x = div.offsetLeft + div.clientWidth - 25
    var y = div.offsetTop + div.clientHeight - 25
    var pt = {
        x: x,
        y: y
    }
    return pt
}