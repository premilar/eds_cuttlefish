

let segPass = (speeds, debug) => {
  let bPositions = [positions[0]]
  let bSpeeds = [speeds[0]]
  // stretchy band ...
  for(let i = 0; i < positions.length - 2; i ++){
    let d = vDist(positions[i], positions[i + 1])
    let vi = speeds[i]
    let vf = speeds[i + 1]
    // if the plain-move time is close to the period, we ship it
    let pt = (2 * d) / (vi + vf)
    if(pt < (period - 0.001)){
      // do we have to ship start- and finish- velocities to the motors?
      // do if we turn around at junctions...
      // goddangit
      // ok, now that we can at least be sure we'll have a minimum time, maybe we can
      // engineer the stepper side to help us out ...
      console.error(`seg in pos ${i} violates plain move time with period ${pt.toFixed(3)}`)
      console.error(d.toFixed(3), vi.toFixed(3), vf.toFixed(3))
    } else {
      if(debug) console.log(`${i} pt ${pt.toFixed(3)}`)
    }
    // check size
    if(pt - period < 2 * period){
      bPositions.push(positions[i])
      bSpeeds.push(speeds[i])
    }
  }
}

let blockPass = (ramps, debug) => {
  let blocks = []
  for (let i = 0; i < ramps.length; i++) {
    let r = ramps[i]
    let d = vDist(r.pi, r.pf)
    // how many blocks are we going to split it to?
    let count = r.t / period
    let integer = Math.round(count)
    if (integer < 1) {
      console.warn(`small ramp during blockPass at ${i}`)
      integer = 1
    }
    // the pos'ns to split to:
    let vu = vUnitBetween(r.pi, r.pf)
    // now just...
    for (let b = 0; b < integer; b++) {
      // percentage through,
      let start = b / integer
      let finish = (b + 1) / integer
      blocks.push([math.add(r.pi, vScalar(vu, start)), math.add(r.pi, vScalar(vu, finish))])
    }
  }
  return blocks
}
