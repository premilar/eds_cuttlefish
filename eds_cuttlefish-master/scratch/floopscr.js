// view force layout,

/* ---------------------------    ---------------------------- */
/* ---------------------- FORCE LAYOUT ----------------------- */
/* ---------------------------    ---------------------------- */

// ok, my thoughts on this
/*

when you're up with big programs, spend a day / a handful, just making the UI sing
- https://bl.ocks.org/mbostock/3750558

at the moment this is kind of 'fine'
 - starting condition is mostly random (and elsewhere) - maybe some graph analysis
  - for who-is-generally-downstream-of-whomst
  - this is nice code golf for boring times when you have lots of graphs
 - still not looking at links for layout force: do that first
 - want to connect this notion with the 'design patterns' ides ...
  - (links) find (comm/*) connected, arrange in a stack
  - (view) finds (link) connected, also stackup ...
   - the links / split through views -> this is actually a lot of the work,
   - and it's not unimportant

*/

let blocks = new Array()
let flsimrun = false
let flsim = {}
let flnodes = []

let finAlpha = 0.1
let sizemultiple = 0.5

// happens when items added, deleted (changing topology)
let updateForceLoop = () => {
  // init and/or update
  if (!flsimrun && blocks.length > 3) {
    // Case for starting sim
    msgbox.write('starting force sim')
    flsimrun = true
    // start with two nodes
    let positions = this.getAllHunkPositions()
    let sizes = this.getAllHunkSizes()
    for (let i in positions) {
      let nd = {
        index: i,
        x: positions[i].x,
        y: positions[i].y,
        vx: 0,
        vy: 0,
        r: sizes[i].width * sizemultiple
      }
      flnodes.push(nd)
    }
    flsim = d3.forceSimulation(flnodes)
      .force('charge', d3.forceManyBody().strength(250))
      .force('center', d3.forceCenter(600, 600))
      .force('collide', d3.forceCollide((node, i, nodes) => {
        return node.r
      }))
      .alphaMin(finAlpha)
      .on('tick', flTick)
      .on('end', flEnd)
  } else if (blocks.length <= 3) {
    // donot
  } else {
    // case for adding / rming from sim
    msgbox.write('UPD8 Force Sim')
    let positions = this.getAllHunkPositions()
    let sizes = this.getAllHunkSizes()
    if (positions.length > flnodes.length) {
      let last = positions.length - 1
      //console.log('to add new node like', positions[last])
      let nd = {
        index: last,
        x: positions[last].x,
        y: positions[last].y,
        vx: 0,
        vy: 0,
        r: sizes[last].width * sizemultiple
      }
      flnodes.push(nd)
      // console.log('SIM adds now this', newNode.x, newNode.y)
    } else {
      //msgbox.write("SIM DELETE CASE NOT WRITTEN")
    }
    flsim.nodes(flnodes)
    flsim.alpha(1)
      .alphaMin(finAlpha)
      .restart()
  }
}

// happens when things perterbed in existing state (i.e. drags)
let kickForceLoop = () => {
  // hmm... but fix the one you're dragging, say?
  flsim.alpha(1).restart()
}

let flTick = () => {
  // called on sim update
  let blks = $(this.plane).children('.block').not('#NROL39_0').not('#TLView')
  if (blks.length !== flnodes.length) {
    console.log('FLOOP NODES MISMATCH', blks.length, flnodes.length)
  } else {
    for (let i = 0; i < blks.length; i++) {
      blks[i].style.left = flnodes[i].x + 'px'
      blks[i].style.top = flnodes[i].y + 'px'
    }
  }
  this.drawLinks()
  if ($(msgbox.zeCheckbox).prop('checked')) {
    this.zoomExtents()
  }
}

let flEnd = () => {
  console.log('FIN DU SIM')
}

this.zoomExtents = () => {
  // to zoom-extends
  let psns = this.getAllHunkPositions()
  let sizes = this.getAllHunkSizes()
  // bless up, these are all in 0,0 relative space
  let minxy = {
    x: 0,
    y: 0
  }
  let maxxy = {
    x: 500,
    y: 500
  }
  let maxx, minx, maxy, miny
  for (let ind in psns) {
    maxx = psns[ind].x + sizes[ind].width
    minx = psns[ind].x
    maxy = psns[ind].y + sizes[ind].height
    miny = psns[ind].y
    // max cases
    if (maxx > maxxy.x) {
      maxxy.x = maxx
    }
    if (maxy > maxxy.y) {
      maxxy.y = maxy
    }
    // min cases
    if (minx < minxy.x) {
      minxy.x = minx
    }
    if (miny < minxy.y) {
      minxy.y = miny
    }
  }
  // margin
  let margin = 100
  minxy.x -= margin
  minxy.y -= margin
  maxxy.x += margin
  maxxy.y += margin
  // ok, compare bounding box to current frustrum ?
  let ct = dt.readTransform(this.plane)
  let wd = this.dom.clientWidth
  let ht = this.dom.clientHeight
  // to find scale, do
  let pfsx = (wd) / (maxxy.x - minxy.x)
  let pfsy = (ht) / (maxxy.y - minxy.y)
  let pfs = Math.min(pfsx, pfsy)
  // write em
  ct.s = pfs
  ct.x = -minxy.x * pfs
  ct.y = -minxy.y * pfs
  dt.writeTransform(this.plane, ct)
  dt.writeBackgroundTransform(this.dom, ct)
}

this.getAllHunkPositions = () => {
  // returns positions as numbers,
  let nds = $(this.plane).children('.block')
  let positions = new Array()
  for (let nd of nds) {
    if ($(nd).attr('id') === "NROL39_0" || $(nd).attr('id') === "TLView") {
      //console.log('skip')
    } else {
      let pos = dt.readXY(nd)
      pos.id = nd.id
      positions.push(pos)
    }
  }
  return positions
  // should do transform here ?
}

this.getAllHunkSizes = () => {
  let nds = $(this.plane).children('.block')
  let sizes = new Array()
  for (let nd of nds) {
    if ($(nd).attr('id') === "NROL39_0" || $(nd).attr('id') === "TLView") {
      //console.log('skip')
    } else {
      let sz = dt.readSize(nd)
      sz.id = nd.id
      sizes.push(sz)
    }
  }
  return sizes
}

// here is where you rm'd drawing & moving


// from http://bl.ocks.org/natebates/273b99ddf86e2e2e58ff

var width = 960,
  height = 500;

var nodes = d3.range(100).map(function(d, i) {
    return {
      width: ~~(Math.random() * 40 + 15),
      height: ~~(Math.random() * 40 + 15),
    };
  }),
  root = nodes[0],
  color = d3.scale.category10();

var svg = d3.select('body').append('svg')
  .attr('width', width)
  .attr('height', height);

svg.selectAll('.rect')
  .data(nodes.slice(1))
  .enter().append('rect')
  .attr('width', function(d) {
    return d.width;
  })
  .attr('height', function(d) {
    return d.height;
  })
  .style('fill', function(d, i) {
    return color(i % 3);
  })
  .attr('transform', function(d) {
    return 'translate(' + (-d.width / 2) + ',' + (-d.height / 2) + ')';
  });

svg.on('mousemove', function() {
  var p1 = d3.mouse(this);

  root.px = p1[0];
  root.py = p1[1];
  force.resume();
});

// mouse node, position off screen initially
root.x = 2000;
root.y = 2000;
root.width = 0;
root.height = 0;
root.fixed = true;

var force = d3.layout.force()
  .gravity(0.05)
  .charge(function(d, i) {
    return i ? -30 : -2000;
  })
  .nodes(nodes)
  .size([width, height]);

force.on('tick', function(e) {
  var q = d3.geom.quadtree(nodes),
    i = 0,
    n = nodes.length;

  while (++i < n) {
    q.visit(collide(nodes[i]));
  }

  svg.selectAll('rect')
    .attr('x', function(d) {
      return d.x;
    })
    .attr('y', function(d) {
      return d.y;
    });
});

force.start();

function collide(node) {
  return function(quad, x1, y1, x2, y2) {
    var updated = false;
    if (quad.point && (quad.point !== node)) {

      var x = node.x - quad.point.x,
        y = node.y - quad.point.y,
        xSpacing = (quad.point.width + node.width) / 2,
        ySpacing = (quad.point.height + node.height) / 2,
        absX = Math.abs(x),
        absY = Math.abs(y),
        l,
        lx,
        ly;

      if (absX < xSpacing && absY < ySpacing) {
        l = Math.sqrt(x * x + y * y);

        lx = (absX - xSpacing) / l;
        ly = (absY - ySpacing) / l;

        // the one that's barely within the bounds probably triggered the collision
        if (Math.abs(lx) > Math.abs(ly)) {
          lx = 0;
        } else {
          ly = 0;
        }

        node.x -= x *= lx;
        node.y -= y *= ly;
        quad.point.x += x;
        quad.point.y += y;

        updated = true;
      }
    }
    return updated;
  };
}
