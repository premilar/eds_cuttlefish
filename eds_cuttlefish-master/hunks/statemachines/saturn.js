/*
hunks/statemachines/saturn.js

packet-time aware motion planner for networked controllers

Jake Read at the Center for Bits and Atoms with Neil Gershenfeld and Leo McElroy
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

import {
  Hunkify,
  Input,
  Output,
  State
} from '../hunks.js'

import {
  vDist,
  vSum,
  vLen,
  vUnitBetween,
  vScalar,
  deg
} from '../../libs/smallvectors.js'

/*

indexing:
we should have a positions[n] of positions to get to,
and speeds[n] of speeds to be-at-when-there
p[0] and s[0] are always current state ... when we len > 1 we have werk 2 do

*/

/*

speedups:
yr boi saturn, chronos, the ancient titan and god of time is *slow* af: about 50ms
to run ~ 64 segments. much could be done to make this faster, (1) would be to ship it to cpp,
which, tbh, is probably the right answer. also:
Math.pow() where num * num would do: bad
array manipulation
calculate distances, etc, only once

*/

export default function Saturn() {
  Hunkify(this)

  let inpts = this.input('array', 'posn')

  let outp = this.output('array', 'posn')

  // here's a case where we might want some type of enum ish thing
  let isIncrementalMode = this.state('boolean', 'incremental mode', false)
  let accelState = this.state('number', 'acceleration (u/s/s)', 20)
  accelState.onChange = (val) => {
    if(val > 30){
      val = 30
    } else if (val < 5){
      val = 5
    }
    accelState.set(val)
    accel = accelState.value
  }
  let speedState = this.state('number', 'speed (u/s)', 100)
  speedState.onChange = (val) => {
    if (val > 200){
      val = 200
    } else if (val < 5){
      val = 5
    }
    speedState.set(val)
    cruise = speedState.value
  }

  let mdmsegOut = this.output('MDmseg', 'motionSegment')

  // settings,
  let deviation = 0.1 // virtual radius to junction about
  let accel = accelState.value // (should be) units/s/s (9.8m/s/s, 9800mm/s/s is 1G)
  let minSpeed = 1.0 // conspicuous, to debug for tails (indexing)
  let period = 0.050 // his.state('number', 'period', 50) // in ms,
  // current states,
  let cruise = speedState.value // target, (units/s) -> (100) is about our max speed ! due to stepper limits, so bee careful

  // our positions (and num segs to plan over)
  let positionsBufferSize = 32
  let positions = [
    [0, 0, 0]
  ] // should always have p[0] (current) and p[1] (one target) when running, at standstill have p[0] only
  let ramps = []
  let speed = minSpeed // currently
  let posUpdated = false

  // OK: *i think* the move might be to do this *first* and then never increase moves
  let periodPass = (speeds, debug) => {
    for (let i = positions.length - 2; i > 0; i--) {
      // distance to make,
      let d = vDist(positions[i], positions[i + 1])
      // the *fastest* we could go if we go flat out, in one period, is
      let v = d / period
      // set self,
      speeds[i] = v
      // traceback:
      if (speeds[i + 1] > speeds[i]) {
        speeds[i + 1] = v
      }
    }
  }

  // run JD: calculate maximum allowable speeds at corners due to instantaneous turnaround limit
  let jd = (speeds, debug) => {
    //console.log('positions', positions)
    let calcJunctionSpeed = (p0, p1, p2, debug) => {
      // junction speed at p1, arrival from p0 exit to p2
      let v0 = math.subtract(p1, p0)
      let v1 = math.subtract(p2, p1)
      if (debug) console.log('for\n', v0, v1)
      let dotprod = math.dot(v0, v1) / (vLen(v0) * vLen(v1))
      if (debug) console.log('dotprod', dotprod)
      // block for floating pt errors that drive this term past +/- 1
      if (dotprod < 1) dotprod = -1
      if (dotprod > 1) dotprod = 1
      let omega = Math.PI - Math.acos(dotprod)
      if (debug) console.log('angle between', deg(omega))
      let r = deviation / (1 / Math.cos(Math.PI / 2 - omega / 2) - 1)
      if (debug) console.log('rad', r)
      let v = Math.sqrt(accel * r)
      if (debug) console.log('permissible', v)
      return v
    }
    // the ops,
    for (let m = 0; m < positions.length; m++) {
      if (m === 0) continue // noop for start: this is our current speed, should already be in speeds arr
      if (m === positions.length - 1) continue // noop for last move, nothing to junction into, exit should be minspeed
      let jd = calcJunctionSpeed(positions[m - 1], positions[m], positions[m + 1])
      if (Number.isNaN(jd)) {
        console.warn(`after jd, NaN for move at ${m}`, positions[m - 1], positions[m], positions[m + 1])
        // run again w/ debug
        calcJunctionSpeed(positions[m - 1], positions[m], positions[m + 1], true)
      }
      if (jd < speeds[m]) {
        speeds[m] = jd
      }
    }
    // walk for minspeeds
    for (let s in speeds) {
      if (speeds[s] < minSpeed) speeds[s] = minSpeed
      if (speeds[s] > cruise) speeds[s] = cruise
    }
    // that's it for us
    return speeds
  }

  // link, tail to head
  let reversePass = (speeds, debug) => {
    // link, walking back from last
    // this makes sure we can completely decelerate, through moves, to the last point at zero
    for (let i = positions.length - 2; i > 0; i--) {
      if (debug) console.log(`reverse pass for ${i}\n`, positions[i], positions[i + 1])
      if (debug) console.log(`current entrance to calculate is`, speeds[i])
      if (debug) console.log(`the constraining exit is`, speeds[i + 1])
      // to calcluate the maximum entrance, given our exit, with pure acceleration:
      let d = vLen(math.subtract(positions[i + 1], positions[i]))
      let maxEntranceByAccel = Math.sqrt(Math.pow(speeds[i + 1], 2) + 2 * accel * d)
      let max = Math.max(minSpeed, Math.min(speeds[i], maxEntranceByAccel))
      // just for logging
      let temp = speeds[i]
      // stay safe w/ current state at zero
      if (i === 0) {
        // only the future can be modified
      } else {
        speeds[i] = max
      }
      if (debug) console.log(`entrance was ${temp}, now ${speeds[i]}`)
    }
  }

  // link, head to tail
  let forwardPass = (speeds, debug) => {
    // link, walk forwards: can we accel to these velocities in time?
    for (let i = 0; i < positions.length - 2; i++) {
      if (debug) console.log(`forwards pass for ${i}\n`, positions[i], positions[i + 1])
      if (debug) console.log(`current exit to calculate is`, speeds[i + 1])
      if (debug) console.log(`the constraining entrance is`, speeds[i])
      let d = vLen(math.subtract(positions[i + 1], positions[i]))
      let maxExitByAccel = Math.sqrt(Math.pow(speeds[i], 2) + 2 * accel * d)
      let max = Math.max(minSpeed, Math.min(speeds[i + 1], maxExitByAccel))
      let temp = speeds[i + 1]
      if (i === positions.length - 2) {
        // tail should always be minspeed, if not, trouble
        if (max > minSpeed) console.warn('trouble halting early')
      } else {
        speeds[i + 1] = max
      }
      if (debug) console.log(`exit was ${temp}, now ${speeds[i + 1]}`)
    }
    // link forwards, now making sure we can accel from our start speed up to the exit
    // here is assuming positions[0] is current position, for which speed is the current velocity
  }

  // seg filter
  let writeSeg = (ramps, vi, vf, pi, pf) => {
    let d = vDist(pi, pf)
    ramps.push({
      vi: vi,
      vf: vf,
      t: 2 * d / (vi + vf),
      pi: pi,
      pf: pf
    })
    //if (segWriteLog) console.log(`wrote seg w/ t: ${ramps[ramps.length - 1].t.toFixed(3)}`)
  }

  let writeTriangle = (ramps, vi, vf, pi, pf) => {
    let d = vDist(pi, pf)
    // not sure when I wrote this eqn, seems to work tho
    let vPeak = Math.sqrt(((2 * accel * d + Math.pow(vi, 2) + Math.pow(vf, 2)) / 2))
    let acDist = (Math.pow(vPeak, 2) - Math.pow(vi, 2)) / (2 * accel)
    let pInter = math.add(pi, vScalar(vUnitBetween(pi, pf), acDist))
    // finally, we have to check here if either / or side is too small, then default to smallticks
    let tSeg1 = (vPeak - vi) / accel
    let tSeg2 = (vPeak - vf) / accel
    if (tSeg1 < period || tSeg2 < period) {
      // bail hard, write one seg only
      writeSeg(ramps, vi, vf, pi, pf)
    } else {
      // write two segs,
      writeSeg(ramps, vi, vPeak, pi, pInter)
      writeSeg(ramps, vPeak, vf, pInter, pf)
    }
  }

  // turn positions, speeds into segments, writing accelerations between
  let rampPass = (speeds, debug) => {
    let ramps = []
    for (let i = 0; i < positions.length - 1; i++) {
      let numRampsBefore = ramps.length
      if (debug) console.log(`ramp pass for ${i}`)
      let pi = positions[i]
      let pf = positions[i + 1]
      let vi = speeds[i]
      let vf = speeds[i + 1]
      let d = vDist(pi, pf)
      let maxEntry = Math.sqrt(Math.pow(speeds[i + 1], 2) + 2 * accel * d)
      let maxExit = Math.sqrt(Math.pow(speeds[i], 2) + 2 * accel * d)
      if (debug) console.log(`entrance speed is ${vi}`)
      if (debug) console.log(`exit speed is ${vf}`)
      if (debug) console.log(`d is ${d}, maxEntry ${maxEntry}, maxExit ${maxExit}`)
      // big switch
      if (maxExit <= vf) {
        // the all-up and all-down segments should always be clear:
        // since we already swept for these cases in the revpass
        if (debug) console.log(`/`)
        writeSeg(ramps, vi, vf, pi, pf)
      } else if (maxEntry <= vi) {
        if (debug) console.log('\\')
        writeSeg(ramps, vi, vf, pi, pf)
      } else if (vi === cruise && vf === cruise) {
        // similarely, since we're not segmenting cruise any farther, it should also be OK
        if (debug) console.log('--')
        writeSeg(ramps, vi, vf, pi, p)
      } else if (vi === cruise) {
        if (debug) console.log('--\\')
        let dcDist = (Math.pow(vi, 2) - Math.pow(vf, 2)) / (2 * accel) // distance to deccelerate
        let pInter = math.add(pf, vScalar(vUnitBetween(pf, pi), dcDist))
        // now, we need to tune accel / cruise phases so that neither t is < 1 period
        let tSeg1 = (d - dcDist) / vi
        let tSeg2 = (vi - vf) / accel
        if (tSeg1 < period || tSeg2 < period) {
          // small segs, just write as one downtick,
          writeSeg(ramps, vi, vf, pi, pf)
        } else {
          // if these are both > one period, we can write 'em
          writeSeg(ramps, vi, vi, pi, pInter)
          writeSeg(ramps, vi, vf, pInter, pi)
        }
      } else if (vf === cruise) {
        if (debug) console.log('/--')
        let acDist = (Math.pow(cruise, 2) - Math.pow(vi, 2)) / (2 * accel)
        let pInter = math.add(pi, vScalar(vUnitBetween(pi, pf), acDist))
        // I feel the same about this as I did above
        let tSeg1 = (cruise - vi) / accel
        let tSeg2 = (d - acDist) / cruise
        if (tSeg1 < period || tSeg2 < period) {
          writeSeg(ramps, vi, vf, pi, pf)
        } else {
          writeSeg(ramps, vi, vf, pi, pInter)
          writeSeg(ramps, vf, vf, pInter, pf)
        }
      } else {
        // here we will handle triangles '/\' and 'full trapezoids' '/--\'
        let dcDist = (Math.pow(cruise, 2) - Math.pow(vf, 2)) / (2 * accel)
        let acDist = (Math.pow(cruise, 2) - Math.pow(vi, 2)) / (2 * accel)
        if (dcDist + dcDist >= d) {
          if (debug) console.log('/\\')
          writeTriangle(ramps, vi, vf, pi, pf)
        } else { // BEGIN TRAP SELECTIONS
          if (debug) console.log('/--\\')
          let pa = math.add(pi, vScalar(vUnitBetween(pi, pf), acDist))
          let pb = math.add(pf, vScalar(vUnitBetween(pf, pi), dcDist))
          // ok,
          let tSeg1 = (cruise - vi) / accel
          let tSeg2 = (d - acDist - dcDist) / cruise
          let tSeg3 = (cruise - vf) / accel
          // here we go
          if (tSeg2 < period) {
            // for this case, contencating into a triangle is fine... it will be within ~ 50ms of extra accel time: not much
            if (debug) console.log('/\\')
            writeTriangle(ramps, vi, vf, pi, pf)
          } else if (tSeg1 < period && tSeg3 < period) {
            // contencate into one ramp
            writeSeg(ramps, vi, vf, pi, pf)
          } else if (tSeg1 < period) {
            // first segment smaller: second larger, third larger
            // contencate first, second into one, then write last
            writeSeg(ramps, vi, cruise, pi, pb)
            writeSeg(ramps, cruise, vf, pb, pf)
          } else if (tSeg3 < period) {
            // last segment smaller: second larger, first larger
            // write first, then contencate second, third into one
            writeSeg(ramps, vi, cruise, pi, pa)
            writeSeg(ramps, cruise, vf, pa, pf)
          } else {
            // forgot the genuine full cruiser, here it is
            writeSeg(ramps, vi, cruise, pi, pa)
            writeSeg(ramps, cruise, cruise, pa, pb)
            writeSeg(ramps, cruise, vf, pb, pf)
          }
        } // end TRAP SELECTIONS
      } // end BIGSWITCH
      if (ramps.length === numRampsBefore) console.warn('zero ramps written for', pi, pf, vi, vf)
    } // end for-over-positions
    return ramps
  }

  let positionsCheck = (speeds) => {
    for (let i = 0; i < positions.length - 1; i++) {
      let d = vDist(positions[i], positions[i + 1])
      let vi = speeds[i]
      let vf = speeds[i + 1]
      let t = 2 * d / (vi + vf)
      if (false) console.log(`ap, ${t.toFixed(3)}`)
      if (t < (period - 0.001)) console.warn('small link in positions check')
    }
  }

  let rampCheck = (ramps) => {
    for (let i = 0; i < ramps.length; i++) {
      let r = ramps[i]
      let d = vDist(r.pi, r.pf)
      let t = 2 * d / (r.vi + r.vf)
      if (t < (period - 0.001)) console.warn('troublesome ramp, small time', r)
      // more than 10% over speed is probably not cool,
      let cruiseAbsMax = cruise + 0.15 * cruise
      if (r.vi > cruiseAbsMax || r.vf > cruiseAbsMax) console.warn('troublesome ramp, high speed', r)
      // check that ramps are continuous
      if (i < ramps.length - 2) {
        let sep = vDist(r.pf, ramps[i + 1].pi)
        if (sep > 0.001) console.warn('troublesome ramp junction', r, ramps[i + 1])
      }
    }
  }

  let writeMDmsegFromRamp = (ramp) => {
    return {
      p0: ramp.pi,
      p1: ramp.pf,
      t: ramp.t,
      v0: ramp.vi,
      a: (ramp.vf - ramp.vi) / ramp.t
    }
  }

  let debugRuntime = false

  // modal-decide to/not load new positions,
  let evalLoad = () => {
    if (isIncrementalMode.value) {
      return (inpts.io() && positions.length == 1)
    } else {
      return ((positions.length < positionsBufferSize) && inpts.io())
    }
  }

  // modal-decide to/not run lookahead
  let evalLookahead = () => {
    if (isIncrementalMode.value) {
      return (positions.length > 1)
    } else {
      return (positions.length > (positionsBufferSize - 2))
    }
  }

  this.loop = () => {
    // handle output to stepper, if we have any existing blocks to issue:
    if (ramps.length > 0 && !mdmsegOut.io()) {
      posUpdated = true
      // multi-dimensional mseg,
      mdmsegOut.put(writeMDmsegFromRamp(ramps[0]))
      // this means we are either inside of two old positions,
      // in which case we update p[0], or at the end of p[0], at p[1]
      let dtp = vDist(ramps[0].pf, positions[1])
      // if we're within 10^-3 of the units, clear it out
      if (debugRuntime) console.log(`at evt, dtp is ${dtp.toFixed(6)}`)
      if (dtp < 0.001) {
        /*
        console.log(`> complete position, had ${positions.length}`)
        for (let i = 0; i < 10; i++) {
          console.log(`> position[${i}] ${positions[i][0].toFixed(3)}, ${positions[i][1].toFixed(3)}, ${positions[i][2].toFixed(3)}`)
        }
        for (let i = 0; i < 10; i++) {
          console.log(`> ramps[${i}].pi ${ramps[i].pi[0].toFixed(3)},${ramps[i].pi[1].toFixed(3)},${ramps[i].pi[2].toFixed(3)}`)
          console.log(`> ramps[${i}].pf ${ramps[i].pf[0].toFixed(3)},${ramps[i].pf[1].toFixed(3)},${ramps[i].pf[2].toFixed(3)}`)
        }
        */
        positions.shift()
        speed = ramps[0].vf
        ramps.shift()
        if (debugRuntime) console.log(`> complete position`)
        // have to recalculate blocks now I think?
      } else {
        if (debugRuntime) console.log(`> updating p[0]`)
        positions[0] = ramps[0].pf
        speed = ramps[0].vf
        ramps.shift()
      }
      if (debugRuntime) console.log(`${ramps.length} ramps, ${positions.length} positions`)
    }

    if (!outp.io() && posUpdated) {
      outp.put(positions[0])
      posUpdated = false
    }

    let logTimes = false

    // load new pts into the array,
    if (evalLoad()) {
      // get the new pt, adding it if it is of any appreciable distance
      let np = inpts.get()
      try {
        if (vDist(np, positions[positions.length - 1]) < (minSpeed * period)) {
          // dunk on 'em
          console.warn(`this move is smaller than the minimum segment defined by our minimum move-time and minimum speed, ${minSpeed * period}, the planner is walking past it`)
        } else {
          positions.push(np) // end of queue
          if (debugRuntime) console.log(`puts new position for ${positions.length}`)
          // THE BUSINESS:
          // ok, here's the lookahead routine:
        }
      } catch (err) {
        console.warn('error caught at saturn input', err)
      }

      // only run lookahead -> shipments if we have ah very-full buffer
      if (evalLookahead()) {
        if (debugRuntime) console.log('lookahead')
        // LOOKAHEAD BEGIN
        if (logTimes) console.time('lookahead')
        // positions[] is global, speeds is generated now
        // speed[0], matching positions[0], are our current situations
        let speeds = new Array(positions.length)
        speeds[0] = speed
        speeds[speeds.length - 1] = minSpeed
        // first, set speeds such that moves can be made within single periods,
        periodPass(speeds)
        if (logTimes) console.timeLog('lookahead')
        // jd runs an algorithm that calculates maximum allowable
        // instantaneous accelerations at corners
        jd(speeds) // at ~ 38ms, this is the beef of it
        if (logTimes) console.timeLog('lookahead')
        // revpass to link by max. accel:
        reversePass(speeds)
        forwardPass(speeds)
        // rough check speeds after initial passes,
        // TODO: if we find these throwing errs, interrupt control when we
        // hit some geometry we can't deal with?
        positionsCheck(speeds)
        if (logTimes) console.timeLog('lookahead')
        // ok, ramps:
        ramps.length = 0
        ramps = rampPass(speeds)
        // is this still conn. to our head?
        if (ramps.length > 0 && debugRuntime) console.log('new ramps', vDist(ramps[0].pi, positions[0]).toFixed(5))
        // and a check,
        rampCheck(ramps)
        if (logTimes) console.timeLog('lookahead')
        if (logTimes) console.timeEnd('lookahead')
        //console.log('new pt\t', positions.length, np)
        // LOOKAHEAD END
        let rp = JSON.parse(JSON.stringify(ramps))
      }
    }
  }
}
