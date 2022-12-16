/*
view/vmsg.js

largely unused appendage

Jake Read at the Center for Bits and Atoms
(c) Massachusetts Institute of Technology 2019

This work may be reproduced, modified, distributed, performed, and
displayed for any purpose, but must acknowledge the squidworks and cuttlefish projects.
Copyright is retained and must be preserved. The work is provided as is;
no warranty is provided, and users accept all liability.
*/

// micro html console

function MessageBox(View) {
  let view = View
  // and things inside of it,
  this.zoomCheckbox = {}

  // tracking a load,
  this.briefState = {
    recipName: '',
    recipVersion: '',
    numHunksLeft: 0,
    numLinksLeft: 0,
    isStateHappenning: false,
    setFromBrief: function(brief) {
      this.recipVer = brief.interpreterVersion
      this.recipName = brief.interpreterName
      this.numHunksLeft = brief.numHunks
      briefStateToDom(this)
    },
    decrementHunks: function() {
      this.numHunksLeft--
      briefStateToDom(this)
    },
    incrementHunks: function() {
      this.numHunksLeft++
      briefStateToDom(this)
    },
    decrementLinks: function() {
      this.numLinksLeft--
      briefStateToDom(this)
    },
    incrementLinks: function() {
      this.numLinksLeft++
      briefStateToDom(this)
    }
  }

  let briefStateToDom = (brief) => {
    let str
    if (brief.numHunksLeft > 0) {
      str = `interpreter: ${brief.recipName} ${brief.recipVer} <br> awaiting ${brief.numHunksLeft} hunks`
    } else {
      str = `interpreter: ${brief.recipName} ${brief.recipVer} <br> all loaded OK`
    }
    $(this.msgbox).find('#titleBox').html(str)
  }

  this.msgbox = {}

  /* ---------------------------    ---------------------------- */
  /* ------------------------- STARTUP ------------------------- */
  /* ---------------------------    ---------------------------- */

  this.init = () => {
    //view.log('message box alive')
    console.log("MSGBOXHELLO")
    // a box,
    this.msgbox = $('<div>').addClass('msgbox').get(0)
    // the title, and id of your manager
    this.msgbox.append($('<div>').attr('id', 'titleBox').addClass('msgboxmsg').append('name and interpreter:<br>~ unknown ~<br>truly').get(0))
    // say hello to your manager,
    this.msgbox.append($('<div><i class="em em-wave"></i>').addClass('msgboxbutton').addClass('msgboxmsg').append(' say hello').click((evt) => {
      view.sayHelloToManager()
    }).get(0))
    // a refresh button
    this.msgbox.append($('<div><i class="em em-arrows_counterclockwise"></i>').addClass('msgboxbutton').addClass('msgboxmsg').append(' refresh view').click((evt) => {
      evt.preventDefault()
      view.refresh()
    }).get(0))
    // and then
    this.isHidden = false
    $(view.dom).append(this.msgbox)
  }

  this.toggleHidden = () => {
    if(this.isHidden){
      $(this.msgbox).show()
    } else {
      $(this.msgbox).hide()
    }
  }

  let tpad = 10

  this.setTopMargin = (num) => {
    tpad = num
    this.checkHeight()
  }

  this.checkHeight = () => {
    let ht = view.dom.clientHeight
    $(this.msgbox).css('height', `${ht - 30 - tpad}px`).css('margin-top', `${tpad}px`)
  }

  this.hide = () => {
    $(this.msgbox).css('display', 'none')
  }

  this.unhide = () => {
    $(this.msgbox).css('display', 'inline')
  }

  /* ---------------------------    ---------------------------- */
  /* -------------------------- WRITE -------------------------- */
  /* ---------------------------    ---------------------------- */

  this.write = (data) => {
    if(true) return false
    // write the message
    this.msgbox.append($('<div> -> ' + data + '</div>').addClass('msgboxmsg').get(0))
    // def check
    let heightcheck = () => {
      let height = 0;
      $(this.msgbox).children().each(function(child) {
        // jquery.each() syntax is a bit odd / different than elsewhere, sorry for inconsistency
        height += this.clientHeight + 5
      })
      return height
    }
    // if too tall, remove
    let ch = this.msgbox.clientHeight
    if (heightcheck() > ch) {
      //console.log('rm 1', heightcheck(), ch)
      $(this.msgbox).children().get(3).remove()
      // two at most, sloppy but fast
      if (heightcheck() > ch) {
        //console.log('rm 2', heightcheck(), ch)
        $(this.msgbox).children().get(3).remove()
      }
    }
  }

  this.clear = () => {
    while($(this.msgbox).children().length > 3){
      $(this.msgbox).children().get(3).remove()
    }
  }

}

export default MessageBox
