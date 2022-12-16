/*
view/vptch.js

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// patches are programs that are *incomplete without you*

import GoGetter from '../../gogetter.js'

function PatchSet(View, MsgBox) {
  let view = View
  let msgbox = MsgBox
  let gg = new GoGetter()

  this.init = () => {
    msgbox.write('hello from patchset')
  }

  // load from server should be assumed, just rip that *baybie*
  this.findPatches = () => {
    // and then,
    if (!(view.interpreterName)) {
      msgbox.write('view on unknown interpeter, cannot save ... refresh view first')
      return false
    }
    return gg.recursivePathSearch('save/contexts/' + view.interpreterName + '/', '.json', false)
  }

  this.findSystems = () => {
    return gg.recursivePathSearch('save/systems/', '.json', false)
  }

  this.getSystem = (name) => {
    return gg.getJson('/save/systems/' + name + '.json')
  }

  // write a prgmem
  this.writeCurrent = (debug) => {
    if (debug) console.log('saving ...')
    // riperoni ok, save them all
    let patch = {
      // cerntakt
      interpreterName: view.interpreterName,
      interpreterVersion: view.interpreterVersion,
      hunks: []
    }
    // the hunks,
    for (let df of view.defs) {
      // we save them all,
      // on load, compare to existing in same position
      if (debug) console.log('writing prep for', df)
      // in order, u c
      // the 'prep' is a patch-rep for a hunk, forgive my names
      let prep = {
        type: df.type,
        name: df.name,
        inputs: [],
        outputs: [],
        states: []
      }
      // HERE: we save state just with the index / value ?
      if (df.states !== undefined) {
        for (let st of df.states) {
          prep.states.push({
            name: st.name,
            type: st.type,
            value: st.value
          })
        }
      }
      // putting these in there, for sport - also allows us to save / edit without running
      if (df.inputs !== undefined) {
        for (let ip of df.inputs) {
          prep.inputs.push({
            name: ip.name,
            type: ip.type
          })
        }
      }
      // roll for links,
      // outputs
      if (df.outputs !== undefined) {
        for (let otp of df.outputs) {
          let oprep = {
            name: otp.name,
            type: otp.type
          }
          if (otp.connections.length > 0) {
            oprep.connections = []
            for (let cn of otp.connections) {
              // connections is an array of
              //console.log('cn', cn)
              oprep.connections.push({
                inHunkIndex: cn.parent.ind,
                inHunkInput: cn.ind
              })
            }
          }
          prep.outputs.push(oprep)
        }
      }

      //
      if (debug) console.log('wrote prep like: ', prep)
      patch.hunks.push(prep)
    }
    // we have this now,
    if (debug) console.log('the final patch: ', patch)
    return patch
  } // end writeCurrent

  let mergeHunkList = (patch, debug) => {
    return new Promise((resolve, reject) => {
      let loadedDefsList = []
      // num to load,
      let ns = patch.hunks.length
      // ok, a promise walker, n is hunk[i]
      let pld = async (n) => {
        // what we want,
        let spec = patch.hunks[n]
        let existing = view.defs[n]
        if (debug) console.log(`PATCH ${view.interpreterName}: hunkmerge, at ${n}`)
        if (debug) {
          console.log('view shows:', view.defs[n])
          console.log('patch wants:', patch.hunks[n])
        }
        // if we have one,
        if (existing !== undefined) {
          // it's a merge, this is only cool if it's the same type,
          // then we can mupdate state
          if (existing.type !== spec.type) {
            reject(`exiting patch merge at ${n} hunk, dissimilar types`)
          } else {
            // check state,
            for (let st in existing.states) {
              if (debug) console.log(`state change: st`, spec.states[st])
              // check if each exists, tho
              if (spec.states[st]) {
                if (existing.states[st].value === spec.states[st].value) {
                  if (debug) console.log('continue')
                  continue
                } else {
                  // oh boy
                  if (debug)console.log(`${n} UPPER BOUND STATECHANGE CALL`)
                  try {
                    if (debug)if (true) console.log(`STCHNG: PATCH ${view.interpreterName}: req change for state: ${existing.states[st].name}`)
                    await view.requestStateChange(existing.states[st], spec.states[st].value)
                  } catch (err) {
                    reject(`error in requesting state change during patch merge ${err}`)
                  }
                  if (debug)console.log(`${n} LOWER BOUND STATECHANGE CALL`)
                }
              } // state doesn't exist,
            } // end for-existing-states
          }
        } else {
          // not existing, so just a straightforward add
          try {
            if (debug) console.log(`PATCH ${view.interpreterName}: req add new hunk of type ${spec.type} and name ${spec.name}`)
            await view.requestAddHunk(spec.type, spec.name, spec.states).then((def) => {
              loadedDefsList.push(def)
            })
          } catch (err) {
            reject(`error in requesting new hunk during patch merge ${err}`)
          }
          // ... .then(() => { pld(n++) }).catch((errmsg) => { reject(`exiting patch merge at ${n} hunk, err...`)})
        } //
        // done w/ states,
        if ((n++) < (ns - 1)) {
          pld(n++)
        } else {
          // done w/ n
          resolve(loadedDefsList)
        }
      } // end async pld,
      // kickoff,
      pld(0)
    })
  } // end mergeHunkList

  let mergeLinkList = async (patch, debug) => {
    return new Promise((resolve, reject) => {
      // I think I'm still a bit off on the ideal syntax for these, but
      let ns = patch.hunks.length
      // the bumptool
      let lnkLoader = async (n) => {
        //console.log('lnkLoader', n)
        for (let op in patch.hunks[n].outputs) {
          if (patch.hunks[n].outputs[op].connections) {
            for (let cn of patch.hunks[n].outputs[op].connections) {
              let opHunkIndex = n
              let opIndex = op
              let inHunkIndex = cn.inHunkIndex
              let inIndex = cn.inHunkInput
              // the output, the input
              let opDef = view.defs[opHunkIndex].outputs[opIndex]
              let ipDef = view.defs[inHunkIndex].inputs[inIndex]
              // these should exist, if not ...
              if (opDef === undefined) {
                reject("output doesn't exist for this link request")
              }
              if (ipDef === undefined) {
                reject("input doesn't exist for this link request")
              }
              // check if we can find this already existing,
              let existing = opDef.connections.find((cand) => {
                // candidate would be an inputdef,
                return cand === ipDef
              })
              if (!existing) {
                try {
                  //console.log('add conn from', opHunkIndex, opIndex, inHunkIndex, inIndex)
                  // TODO: sometimes hunks change, and inputs go away ... we need to catch those errs here
                  await view.requestAddLink(opDef, ipDef)
                } catch (err) {
                  reject(err)
                }
              } else {
                //console.log('exists:', opHunkIndex, opIndex, inHunkIndex, inIndex)
              }
            }
          } // end if-has-connections
        } // end for-each-output
        if ((n++) < (ns - 1)) {
          lnkLoader(n++)
        } else {
          resolve(`loaded ${n} links`)
        }
      } // fin lnkloader
      lnkLoader(0)
    })
  }

  this.getPatch = (name) => {
    return gg.getJson('/save/contexts/' + view.interpreterName + '/' + name + '.json')
  }

  // MERGE: it's a doozy:
  this.mergePatch = (patch, debug) => {
    return new Promise((resolve, reject) => {
      console.log('merge for', patch)
      // (2) check that we have a patch for this interpreter,
      //console.log('the patch', patch)
      if (patch.interpreterName !== view.interpreterName) {
        msgbox.write(`WARN: loading patch built in a different interpreter... some hunks may not exist: patch for: "${patch.interpreterName}", but view is connected to "${view.interpreterName}"`)
      }
      if (patch.interpreterVersion !== view.interpreterVersion) {
        msgbox.write(`WARN: loading patch built in a different version of the interpreter... patch from "${patch.interpreterVersion}" and manager is running "${view.interpreterVersion}"`)
      }
      // (3) we're going to load all of the hunks, one by one (not touching links)
      mergeHunkList(patch, debug).then((defs) => {
        // (4) then we can follow on adding links,
        mergeLinkList(patch, debug).then(() => {
          view.tlv.globalOrganize()
          resolve(defs)
        }).catch((errmsg) => {
          // link catch
          reject(`mergePatch error during link loading;`)
          console.log(errmsg)
        })
      }).catch((errmsg) => {
        // hunk catch
        reject(`mergePatch error during hunk loading; ${errmsg}`)
        console.log(errmsg)
      })
      // continue loading ... write a bootload of messages, in queu, waiting for each response?
    })
  }

}

export default PatchSet
