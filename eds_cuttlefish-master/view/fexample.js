/*
view/fexample.js

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// this is a custom d3 force, written as an es6 module like the lord intended
// an experiment,
// also: jake learns how the pros write js (?)

import constant from './fconstant.js'

// this force just
// to start, I'm going to .vx things with some right bias, just to
// test
export default function(x){
  var strength = constant(0.1),
      nodes,
      strengths,
      xz

  // starting off strong w/ this mystery,
  if(typeof x !== 'function') x = constant(x == null ? 0 : +x)

  // alpha is the energy in the simulation,
  // that is slowly 'annealed' out
  function force(alpha) {
    for(var i = 0, n = nodes.length, node; i < n; ++i){
      node = nodes[i]
      let vxa = (xz[i] - node.x) * strengths[i] * alpha
      // console.log('did', vxa)
      node.vx += vxa
    }
  }

  function initialize() {
    if(!nodes) return;
    var i, n = nodes.length
    strengths = new Array(n)
    xz = new Array(n)
    for(i = 0; i < n; ++i){
      // recall, x is a fn we can pass into this constructor
      // to define how we set strength,
      strengths[i] = isNaN(xz[i] = +x(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes)
      // that '+strengths()' "coerces" whatever strength returns into a number,
    }
  }

  // public handles?
  force.initialize = function(_){
    nodes = _;
    initialize()
  }

  force.strength = function(_){
    // bonkers
    return arguments.length ? (strength = typeof _ === 'function' ? _ : constant(+_), initialize(), force) : strength;
  }

  force.x = function(_){
    return arguments.length ? (x = typeof _ === 'function' ? _ : constant(+_), initialize(), force) : x;
  }

  return force
}
