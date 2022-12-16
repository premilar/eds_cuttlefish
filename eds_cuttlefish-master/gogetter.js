/*
gogetter.js

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// fs abstraction for sys

function GoGetter() {
  // I'm keeping this here because GoGetter is localized to the environment, mgr is not
  this.interpreterName = 'cuttlefish'
  this.interpreterVersion = 'v0.1'

  this.recursivePathSearch = (root, debug) => {
    return new Promise((resolve, reject) => {
      jQuery.get(`/fileList?path=${root}`, (resp) => {
        //console.log('resp at jq', resp)
        resolve(resp)
      })
    })
  }

  // https://github.com/tc39/proposal-dynamic-import
  this.importSource = (url) => {
    // escape characters that are used to delimit the module URL.
    // this way the following module works: 'data:text/javascript,console.log("hello")'
    url = url.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    //
    let ogurl = url;
    // try adding this query modifier to convince the browser it's new (if not, cannot refresh source)
    url += `?mtime=${performance.now()}`
    // to try...
    return new Promise((resolve, reject) => {
      import(url).then((obj) => {
        resolve(obj.default)
      }).catch((err) => {
        // at these levels, probably ah syntax error
        if(err.name === "SyntaxError"){
          console.error("Syntax Error at Load")
          console.error("in:", ogurl)
          console.error("at line:", err.lineNumber)
          reject(err)
        } else {
          reject(err)
        }
      })
    })

    // ... previously, this hack... but why?
    /*
    return new Promise((resolve, reject) => {
      const script = document.createElement("script")
      const tempGlobal = "__tempModuleLoadingVariable" + Math.random().toString(32).substring(2
      function cleanup() {
        delete window[tempGlobal]
        script.remove()
      }
      window[tempGlobal] = function(module) {
        cleanup()
        //console.log('ADDHUNK (2) import resolves', url)
        resolve(module[Object.keys(module)[0]])
      }
      script.type = "module"
      script.onerror = () => {
        console.error(`error from imported script...`, err)
        reject(new Error("Failed to load module script with URL " + url))
        cleanup()
      }
      script.textContent = `import * as m from "${url}"; window.${tempGlobal}(m);`
      document.documentElement.appendChild(script)
    })
    */
  }

  this.getJson = (path) => {
    return new Promise((resolve, reject) => {
      console.log('to get', path)
      $.ajax({
        url: path,
        type: 'GET',
        success: (data) => {
          resolve(data)
        },
        error: (err) => {
          reject(new Error("failure at GG ajax get for json object: program probably doesn't exist"))
        }
      })
    })
  }

}

export default GoGetter
