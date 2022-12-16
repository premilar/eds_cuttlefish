/*
hunks/interface/threejs_ghost.js

takes array for point, draws history of segements in tail
a-la snake, but you can never win or loose

Jake Read at the Center for Bits and Atoms
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

import * as THREE from '../../libs/three.module.js'
import { OrbitControls } from '../../libs/three_orbitcontrols.module.js'
// really hacking the import here... apologies, works though!
import { MeshLine, MeshLineMaterial } from '../../libs/three_meshline.module.js'

let numSegs = 100

export default function ThreeGhosts() {
  Hunkify(this)

  let ptin = this.input('array', 'point')

  this.dom = {}

  this.init = () => {
    this.dom = $('<div>').get(0)
  }

  let width = 1000
  let height = 1000
  let lineWidth = 10
  let geometry = new THREE.Geometry()
  let startSegLength = 100 / numSegs
  for (let i = numSegs; i > 0; i--) {
    geometry.vertices.push(new THREE.Vector3(startSegLength * i, startSegLength * i, startSegLength * i))
  }

  let updatePts = []

  let line = new MeshLine() // first arg is pts, 2nd is width setting fn
  line.setGeometry(geometry, function(p) { return lineWidth })
  let material = new MeshLineMaterial({
    color: 0x000000,
    resolution: new THREE.Vector2(width, height)
  })

  let pushToLine = (pt) => {
    let v3 = new THREE.Vector3(pt[0], pt[1], pt[2])
    geometry.vertices.push(v3)
    geometry.vertices.shift()
    line.advance(v3)
  }

  let camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000)
  camera.up.set(0, 0, 1)

  let bbox = new THREE.Box3()
  let bbCenter = new THREE.Vector3()
  let bbSize = new THREE.Vector3()
  console.log('line', line)

  this.onload = (dom) => {
    let scene = new THREE.Scene()
    scene.background = new THREE.Color(0xc8e6e2)

    let renderer = new THREE.WebGLRenderer()
    renderer.setSize(width, height)
    this.requestResize(width, height)

    this.dom.appendChild(renderer.domElement)
    let axesHelper = new THREE.AxesHelper(10)
    scene.add(axesHelper)

    let mesh = new THREE.Mesh(line.geometry, material)
    scene.add(mesh)

    //let controls = new OrbitControls(camera, this.dom)
    //controls.update()
    camera.position.set(840, 100, 1300)
    camera.lookAt(new THREE.Vector3(900, 600, 10))

    console.log(line)

    let animate = function() {
      //
      // requestAnimationFrame(animate)
      setTimeout(animate, 500)
      if (updatePts.length > 0) {
        let nextpt = updatePts.shift()
        // advance removes the oldest position, so we should start w/ the # we want
        pushToLine(nextpt)
        // do bounding box...
        /*
        bbox.setFromPoints(geometry.vertices)
        bbox.getCenter(bbCenter)
        bbox.getSize(bbSize)
        const maxDim = Math.max(bbSize.x, bbSize.y, bbSize.z)
        const fov = camera.fov * (Math.PI / 180)
        let cameraZ = Math.abs(maxDim / 4 * Math.tan(fov * 2))
        cameraZ *= cameraZ
        console.log(cameraZ)
        camera.position.z = cameraZ
        const minZ = bbox.min.z
        const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ
        camera.far = cameraToFarEdge * 3
        camera.updateProjectionMatrix()
        camera.lookAt(bbCenter)
        */
      }
      //controls.update()
      renderer.render(scene, camera)
    }
    // kickstart
    animate()

    /*
    // xyz,
    832, 103, 1300
    // dir
    0.04, 0.4, -0.9
    */
    /*
    let caminfo = () => {
      console.log(camera.position)
      let dir = new THREE.Vector3
      camera.getWorldDirection(dir)
      console.log(dir)
      setTimeout(caminfo, 1000)
    }
    setTimeout(caminfo, 1000)
    */
  }

  this.loop = () => {
    if (ptin.io()) {
      updatePts.push(ptin.get())
      /*
      geometry.vertices.push(new THREE.Vector3(pt[0], pt[1], pt[2]))
      if(geometry.vertices.length > 32){
        geometry.vertices.shift()
      }
      geometry.verticesNeedUpdate = true
      */
    }
  }
}
