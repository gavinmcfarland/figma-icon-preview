// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

// This shows the HTML page in "ui.html".

function clone(val) {
  return JSON.parse(JSON.stringify(val))
}

const exportSettings = {
  format: "PNG",
  constraint: {
    type: "SCALE",
    value: 8
  }
}

var targetID

async function getImage(refresh?) {



  var target

  if (refresh) {
    target = figma.currentPage.findOne(n => n.id === targetID)
  } else {
    target = figma.currentPage.selection[0]
  }

  if (target) {
    if (target.type === "FRAME" || target.type === "GROUP" || target.type === "COMPONENT" || target.type === "INSTANCE") {

      if (!refresh) {
        targetID = clone(figma.currentPage.selection[0]).id
      }

      var imageBytes = await target.exportAsync(exportSettings)

      figma.ui.postMessage(imageBytes)
    }
  }



}

figma.showUI(__html__);

getImage()

figma.on("selectionchange", () => {
  getImage()
})

figma.ui.onmessage = msg => {

  if (msg.type === 'refresh') {
    getImage(true)
  }

};
