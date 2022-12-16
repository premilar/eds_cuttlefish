/*
view/vcontextmenu.js

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// writes the context (right-click) menu ...

function cfContextMenu(evt, view, dt) {
  // coupla handy utilities:
  let addContextTitle = (text) => {
    $(view.dom).find('.contextmenu').get(0).append($('<ul>' + text + '/</li>').get(0))
  }

  let addContextOption = (text, click) => {
    $(view.dom).find('.contextmenu').get(0).append($('<li>' + text + '</li>').click((click)).get(0))
  }

  let changeContextTitle = (text) => {
    // clear,
    $(view.dom).find('.contextmenu').children().remove()
    // overkill, but fun
    let menu = $(view.dom).find('.contextmenu').get(0)
    let title = $(`<div>${text}</div>`).addClass('contextTitle').get(0)
    $(view.dom).find('.contextmenu').append(title)
    //   // add the text window, select it ...
    // also want: keyboard and enter ... track which is selected, then ?
    let tinput = $('<input>').attr('type', 'text').attr('size', 28).attr('value', '').get(0)
    $(view.dom).find('.contextmenu').children('.contextTitle').get(0).append(tinput)
    $(tinput).focus()
    $(tinput).select()
    tinput.addEventListener('keyup', (evt) => {
      let arr = $(view.dom).find('.contextmenu').children('li').toArray()
      if (evt.keyCode == 13) {
        // enter case
        let pick = $(view.dom).find('.contextmenu').children('.highlighted').get(0)
        pick.click()
      } else {
        // key character ?
        let filts = tinput.value.toUpperCase().split(' ')
        let sel = false
        // separate items by space, search for either,
        // reorder by search quality
        for (let item of arr) {
          // we want the items that match *some part of both items in the filt*
          let pass = true
          for (let conf of filts) {
            if ($(item).text().toUpperCase().indexOf(conf) < 0) {
              pass = false
            }
          }
          if (pass) {
            item.style.display = ""
            // mark as selected, then this is our enter-docu
            if (!sel) {
              $(item).addClass('highlighted')
              sel = true
            } else {
              $(item).removeClass('highlighted')
            }
          } else {
            item.style.display = "none"
            $(item).removeClass('highlighted')
          }
        }
      }
    })
  }

  let fadeOut = (ms) => {
    setTimeout(() => {
      $(view.dom).find('.contextmenu').fadeOut(ms, function() {
        $(this).remove()
      })
    }, ms)
  }

  let setupForSave = (se, callback) => {
    $(se.target).closest('li').text('')
    let tinput = $('<input>').attr('type', 'text').attr('size', 24).attr('value', 'name').get(0)
    $(se.target).closest('li').append(tinput) // etc
    $(tinput).focus()
    $(tinput).select()
    $(tinput).on('keyup', (ke) => {
      if (ke.keyCode == 13) {
        callback(tinput.value)
        // this would present a download link
        /*
        let url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], {
          type: "application/json"
        }))
        // hack to trigger the download,
        let anchor = $('<a>ok</a>').attr('href', url).attr('download', tinput.value + '.json').get(0)
        $(ke.target).closest('li').append(anchor)
        anchor.click()
        // finally, rip
        fadeOut(400)
        */
      }
    })
  }

  // ok, do work
  // exit if we're not on target
  if (!$(evt.target).is('.view')) return false

  // global contextemenu rm for existing floaters (we are toplevel)
  $(view.dom).find('.contextmenu').remove()

  // one only,
  evt.preventDefault()
  evt.stopPropagation()

  // the view we would issue from,m
  let scope = evt.target.hunk
  if (!scope) {
    console.error('contextmenu, no scope')
    return false
  }
  console.log(`-> contextmenu for ${scope.name}`)

  // make the menu,
  let menu = $('<div>').addClass('contextmenu').get(0)
  // lay it down in screen-space
  dt.writeTransform(menu, {
    s: 1,
    x: evt.clientX + 3, // (pt.s + -0.1 * (pt.s-1))),
    y: evt.clientY - 29 //- 31 * 2 // + -0.1 * (pt.s-1)))
  })
  $(view.dom).append(menu)
  // give it a scrollutil

  menu.addEventListener('wheel', (evt) => {
    let mt = dt.readTransform(menu)
    dt.writeTransform(menu, {
      s: mt.s,
      x: mt.x,
      y: mt.y - evt.deltaY*4
    })
  })

  // hmmm
  changeContextTitle('do:  ')
  // on of the options will ...

  /* ---------------------------    ---------------------------- */
  /* ---------------- LOCAL OPTIONS, for SCOPE ----------------- */
  /* ---------------------------    ---------------------------- */

  /*
  addContextOption(`debug option`, (ce) => {
    jQuery.ajax({
      url: `/save/systems/sysname.json`,
      type: 'PUT',
      data: {
        name: 'program',
        type: 'supposed-program'
      },
      success: (result) => {
        console.log('jq debug put result', result)
      },
      error: (err) => {
        console.log('jq ajax err', err)
      }
    })
  })
  */

  addContextOption(`<i class="em em-twisted_rightwards_arrows"></i> refresh the view`, (ce) => {
    // this actually gets wiped when the first hunk arrives, so
    $(ce.target).closest('li').text('refreshing...')
    scope.refresh().then(() => {
      $(ce.target).closest('li').text(`refresh complete !`)
      fadeOut(400)
    })
  })

  addContextOption(`<i class="em em-wave"></i> say hello`, (ce) => {
    $(ce.target).closest('li').text(`view says hello ...`)
    scope.sayHelloToManager().then((ms) => {
      $(ce.target).closest('li').text(`msg took ${ms}ms rtt from browser`)
      fadeOut(400)
    })
  })

  // req a new hunk,
  addContextOption('<i class="em em-construction_worker"></i> add a hunk', (ce) => {
    $(ce.target).closest('li').text('requesting a list of hunks...')
    scope.requestListAvail().then((stringlist) => {
      //console.log('list', stringlist)
      changeContextTitle('load:')
      // sort the list...
      let treelike = [{
        parentname: '',
        list: []
      }]
      for (let item of stringlist) {
        let slash = item.indexOf('/')
        if (slash > 0) {
          let head = item.substring(0, slash)
          // add to or make,
          let parent = treelike.find((cand) => {
            return cand.parentname === head
          })
          if (parent) {
            parent.list.push(item)
          } else {
            treelike.push({
              parentname: head,
              list: [item]
            })
          }
        } else {
          treelike[0].list.push(item)
        }
      }
      for (let branch of treelike) {
        addContextTitle(branch.parentname)
        for (let item of branch.list) {
          addContextOption(item, (ce) => {
            $(ce.target).closest('li').append(' > requested ... ')
            //vw.msgbox.write(`requested one new ${item}`)
            scope.requestAddHunk(item).then((def) => {
              fadeOut(200)
              //console.log('one hunk as promised', def)
            }).catch((err) => {
              changeContextTitle('error, see consoles')
              fadeOut(1000)
            })
          })
        }
      }
    })
  })

  // save patches
  /*
  addContextOption('<i class="em em-blue_book"></i> save this context', (ce) => {
    let ptch = scope.patchset.writeCurrent()
    setupForSave(ce, (name) => {
      jQuery.post(`/save/contexts/${scope.interpreterName}/${name}`, ptch, (res) => {
        if(!res.success){
          console.error("server-side error while saving")
        } else {
          console.log('save context ok')
          fadeOut(400)
        }
      }, 'json')
    })
  })
  */

  /*
  // load patches,
  addContextOption('<i class="em em-hammer"></i> restore into this context', (ce) => {
    $(ce.target).closest('li').append(' > loading a list ...')
    scope.patchset.findPatches().then((list) => {
      // title, and options
      changeContextTitle('available server contexts:')
      for (let item of list) {
        addContextOption(item, (ce) => {
          try {
            scope.patchset.getPatch(item).then((ptch) => {
              return scope.patchset.mergePatch(ptch)
            }).then((defs) => {
              console.log("patch loaded, running GO")
              view.globalOrganize()
              fadeOut(400)
            }).catch((errmsg) => {
              console.error(errmsg)
              changeContextTitle('error, see consoles')
              fadeOut(1000)
            })
          } catch (err) {
            console.error(err)
          }
        })
      }
    })
  })
  */

  /* ---------------------------    ---------------------------- */
  /* ------------------ QUEEN OF THE MOUNTAIN ------------------ */
  /* ---------------------------    ---------------------------- */

  // write these if the click was into the toplevel
  if (scope.name !== 'tlview') return false
  // save the entire system,
  addContextOption('<i class="em em-books"></i> save this system', (ce) => {
    // for posterity, bc of often-broken-due-to-def-rewrite (bugfarm!),
    // we run a GO before we do this...
    let debug = true
    if (debug) console.log(`SS: running GO`)
    view.globalOrganize()
    // the top ... scope = view, so
    let tlp = view.patchset.writeCurrent()
    // heirarchichal traverse,
    let recursor = (scope, branch, ld) => {
      if (debug) console.log(`SS: recurse at ${scope.name} thru ${ld.name}`)
      // ld -> link def
      // scope -> view that this link lives within
      let localScope = view.trace(ld.outputs[1], debug)
      if (debug) console.log("SAVESYS: traces to ", localScope)
      // if this link traces up to a view,
      if (localScope && localScope.parent.type === 'view' && localScope.parent.hunk.hasRefreshed) {
        // for the reciprocal link, nest
        localScope = localScope.parent.hunk
        if (debug) console.log("SAVESYS: traces to view")
        // we can use this view to write its contents
        let nlp = localScope.patchset.writeCurrent()
        // now we need to put it ...
        branch.hunks[ld.ind].contains = nlp
        // find the 'otherLink' state object
        let oli
        for (let st of ld.states) {
          if (st.name === 'otherLink') {
            oli = st.value
          }
        }
        // and continue,
        for (let dfi in localScope.defs) {
          // don't walk backwards !
          if (dfi === oli) continue
          let df = localScope.defs[dfi]
          if (df.type === 'link') {
            recursor(localScope, nlp, df)
          }
        }
      } else {
        // no view for this link, don't traverse
      }
    } // fin traverse
    //
    // kick off firstverse ...
    for (let df of view.defs) {
      if (df.type === 'link') {
        recursor(view, tlp, df)
      }
    } // end recursive cycle ?

    // once that runs to completion, should have the hierarchichal patch
    // console.log('CONSIDER THIS: a system patch ... ', tlp)
    // now present-and-save
    setupForSave(ce, (name) => {
      jQuery.post(`/save/systems/${name}`, tlp, (res) => {
        if(!res.success){
          console.error("server-side error while saving")
        } else {
          console.log('save system ok')
          fadeOut(400)
        }
      }, 'json')
    })
  }) // end save entire system

  // MERGE A SYSTEM
  // careful: two 'ce' variables in lower scope ?
  addContextOption('<i class="em em-hammer_and_wrench"></i> restore a system', (ce) => {
    // get the data ...
    view.patchset.findSystems().then((list) => {
      // title, and options
      changeContextTitle('available server systems:')
      for (let item of list) {
        addContextOption(item, (ce) => {
          view.restoreEntireSystem(item)
        })
      }
    })
  })

}

export default cfContextMenu
