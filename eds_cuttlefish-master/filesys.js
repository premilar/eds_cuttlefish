/*
filesys.js

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// server-side file management, just a brief wrap on node fs 

const fs = require('fs')

module.exports = {
  // get a tree: takes the root (relative the process) and returns all branches below,
  // includes route-to-root in list
  getDirTree: (dir, debug) => {
    let tld = dir
    return new Promise((resolve, reject) => {
      // items and count,
      let list = []
      let count = 0
      // recursor,
      let launch = (dir) => {
        if (debug) console.log('GDT launch at', dir)
        // just counting actually,
        count++
        fs.readdir(dir, (err, files) => {
          if (err) {
            reject(err)
          }
          count--
          try {
            for (file of files) {
              if (file.includes('.')) {
                let listAddition = `${dir.substring(__dirname.length + tld.length)}/${file}`
                if (debug) console.log('GDT pushing', listAddition)
                list.push(listAddition)
              } else {
                let launchPoint = `${dir}${file}`
                if (debug) console.log('GDT launching', launchPoint)
                launch(launchPoint)
              }
            }
          } catch (err) {
            // just walk on ...
            console.log('walkover error:', err)
            console.log('problem dir:', dir)
            // and push up, give up on counting
            list.sort()
            resolve(list)
          }
          if (debug) console.log('GDT size', count)
          if (!count) {
            // we sort,
            list.sort()
            if(debug) console.log('list at fin getDirTree', list)
            resolve(list)
          }
        }) // end fs.readdir
      } // end launch
      launch(`${__dirname}/${dir}`)
    })
  }
}
