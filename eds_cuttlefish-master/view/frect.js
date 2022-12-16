/*
view/frect.js

D3 custom force for rectangular collisions, needs work 

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import constant from "./fconstant.js";
import jiggle from "./fjiggle.js";

const quadtree = d3.quadtree

function x(d) {
  return d.x + d.vx;
}

function y(d) {
  return d.y + d.vy;
}

export default function(radius) {
  var nodes,
      radii,
      strength = 1,
      iterations = 1

  if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius)

  function force() {
    var i, n = nodes.length,
        tree,
        node,
        xi,
        yi,
        ri,
        ri2;

    for (var k = 0; k < iterations; ++k) {
      // we pass to the qt, x and y as they will be computed in the
      // next step (see fn's above)
      tree = quadtree(nodes, x, y)
      for (i = 0; i < n; ++i) {
        node = nodes[i]
        // node left, right (a note: .bb.x- should be 0-based)
        var nxl = node.x + node.bb.x1
        var nxr = node.x + node.bb.x2
        var nyt = node.y + node.bb.y1
        var nyb = node.y + node.bb.y2
        // node center-by-bounding-box
        var cnx = (nxr - nxl) / 2 + nxl
        var cny = (nyb - nyt) / 2 + nyt
        // for each node, visit each...
        //console.log(`visit ${node.index}`)
        tree.visit(apply)
      }
    }

    function apply(quad, x0, y0, x1, y1) {
      let updated = false
      var data = quad.data, r
      if (data) {
        var rj = data.r
        r = ri + rj
        // prevents from op'ing twice
        if (data.index > node.index) {
          // quad.data is the node,
          // by domain intersections...
          //                              | -------- x ------ |
          //          | ------------ x ------ |
          // | ---- x --- |
          // data left, right
          let dxl = data.x + data.bb.x1
          let dxr = data.x + data.bb.x2
          // dxr or dxl within nx,
          if(nxl < dxr && dxr < nxr || nxl < dxl && dxl < nxr){
            // now write these
            let dyt = data.y + data.bb.y1
            let dyb = data.y + data.bb.y2
            // and check,
            if(nyt < dyt && dyt < nyb || nyt < dyb && dyb < nyb){
              updated = true
              // ok then, compute centers to find a direction for force-exertion
              // maybe should also do this in prepare also (and the node data, only once)
              let cdx = (dxr - dxl) / 2 + dxl
              let cdy = (dyb - dyt) / 2 + dyt
              // x overlap term
              let xo = 0
              if(cnx < cdx){
                xo = nxr - dxl
              } else {
                xo = nxl - dxr
              }
              // y overlap term
              let yo = 0
              if(cny < cdy){
                yo = nyb - dyt
              } else {
                yo = nyt - dyb
              }
              // just assert one axis
              if(Math.abs(xo) > Math.abs(yo)){
                node.vy -= yo * strength
                data.vy += yo * strength
              } else {
                node.vx -= xo * strength
                data.vx += xo * strength
              }
            }
          }
        }
        return
      } // end if-data
      return updated
    } // end apply()
  }

  function initialize() {
    if (!nodes) return
  }

  force.initialize = function(_) {
    nodes = _
    initialize()
  }

  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength
  }

  return force
}
