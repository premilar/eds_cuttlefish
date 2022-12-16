/*
cf.js

entry point to start cuttlefish server
serves files as if a static server, handles requests
to write new contexts and systems to server-side memory 

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// new year new bootstrap

const express = require('express')
const app = express()
// this include lets us read data out of put requests,
const bodyparser = require('body-parser')
// our fs tools,
const fs = require('fs')
const filesys = require('./filesys.js')
// and we occasionally spawn local pipes (workers)
const child_process = require('child_process')
// will use these to figure where tf we are
let ownIp = ''
const os = require('os')
let ifaces = os.networkInterfaces()

// serve everything: https://expressjs.com/en/resources/middleware/serve-static.html
app.use(express.static(__dirname))
// accept post bodies as json,
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended: true}))

// if these don't exist, they get 'nexted' to any other 'middleware' we write
app.get('/fileList', (req, res) => {
  try{
    // we would fs/ through our list, and serve that,
    filesys.getDirTree(req.query.path).then((list) => {
      // take the query out of the front of the path, and swap all \ for /
      // rm the first /
      for(i in list){
        if(list[i].charAt(0) == '/'){
          list[i] = list[i].substring(1, list[i].indexOf('.'))
        }
        // a final sweep, for double /
        if(list[i].charAt(0) == '/'){
          list[i] = list[i].substring(1)
        }
      }
      // console.log('sends', list)
      res.send(list)
      // ship up north,
    }).catch((err) => {
      res.send(err)
      // ship err back
    })
  } catch (err) {
    console.log(err)
    res.send('server-side error retrieving list')
  }
})

let unfjson = (program) => {

}

// we also handle file-saving this way,
app.post('/save/contexts/:context/:file', (req, res) => {
  // this is probably fine for now, but I kind of want a websocket to do this kind of stuff ?
  let serialized = JSON.stringify(req.body, null, 2)
  // .. one-hack pls:

  fs.writeFile(`save/contexts/${req.params.context}/${req.params.file}.json`, serialized, (err) => {
    if (err) {
      console.log(`ERR while saving to save/contexts/${req.params.context}/${req.params.file}.json`)
      res.send({success: false})
    }
    console.log(`saved a context to to save/contexts/${req.params.context}/${req.params.file}.json`)
    res.send({success: true})
  })
})
// and for systems,
app.post('/save/systems/:file', (req, res) => {
  let serialized = JSON.stringify(req.body, null, 2)
  fs.writeFile(`save/systems/${req.params.file}.json`, serialized, (err) => {
    if (err) {
      console.log(`ERR while saving to save/systems/${req.params.file}.json`)
      res.send({success: false})
    }
    console.log(`saved a system to to save/systems/${req.params.file}.json`)
    res.send({success: true})
  })
})

// we also want to institute some pipes: this is a holdover for a better system
// more akin to nautilus, where server-side graphs are manipulated
// for now, we just want to dive down to a usb port, probably, so this shallow link is OK
let processes = []
app.get('/spawnProcess/:file', (req, res) => {
  // launches another node instance at this file w/ these args,
  let args = ''
  if(req.query){
    args = req.query.args.split(',')
  }
  console.log(`forking ${req.params.file} with ${args}`)
  const process = child_process.fork(`processes/${req.params.file}`)
  process.on('message', (data) => {
    console.log(`process ${process.pid} message:`, data)
    processes.push(process)
    res.send({startup: true, pid: process.pid, ip: ownIp, port: data.port})
  })
  process.on('error', (err) => {
    console.log(`process ${process.pid} error:`, err)
  })
  process.on('exit', (code) => {
    console.log(`process ${process.pid} exits:`, code)
  })
  process.on('close', (code) => {
    console.log(`process ${process.pid} closes:`, code)
  })
})

app.get('/killProcess', (req, res) => {
  console.log('kill cm for ', req.query.pid)
  for(proc of processes){
    if(proc.pid == req.query.pid){
      // a local listener,
      proc.on('exit', (err) => {
        res.send({success: true})
      })
      proc.kill()
    }
  }
})

// finally, we tell the thing to listen here:
let port = 8080
app.listen(port)

// this just logs the processes IP's to the termina
Object.keys(ifaces).forEach(function(ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function(iface) {
    if ('IPv4' !== iface.family){//} || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }
    ownIp = iface.address
    if (alias >= 1) {
      console.log('cf available on: \t' /*ifname + ':' + alias,*/ + iface.address + `:${port}`);
      // this single interface has multiple ipv4 addresses
      // console.log('serving at: ' ifname + ':' + alias + iface.address + `:${port}`);
    } else {
      console.log('cf available on:\t' /*ifname + ':' + alias,*/ + iface.address + `:${port}`);
      // this interface has only one ipv4 adress
      //console.log(ifname, iface.address);
    }
    ++alias;
  });
});
