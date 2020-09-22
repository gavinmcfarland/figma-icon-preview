function clone(val) {
  return JSON.parse(JSON.stringify(val))
}

function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this, args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

const exportSettings = {
  format: "PNG",
  constraint: {
    type: "SCALE",
    value: 2
  }
}

var iconExports = [
  {
    size: 16
  },
  {
    size: 24
  },
  {
    size: 32
  },
  {
    size: 48
  },
  {
    size: 64
  },
  {
    size: 72
  },
  {
    size: 96
  },
  {
    size: 112
  },
  {
    size: 128
  }

]

var message: any = {
  thumbnail: "",
  icons: [],
  name: ""
}

var lastSelectedNode

var imageBytes

async function getImage(refresh?) {

  var target

  if (refresh) {
    target = lastSelectedNode
  } else {
    target = figma.currentPage.selection[0]
  }

  if (target) {
    if (target.type === "FRAME" || target.type === "GROUP" || target.type === "COMPONENT" || target.type === "INSTANCE") {
      if (target.height <= 256 || target.width <= 256) {
        if (!refresh) {
          lastSelectedNode = figma.currentPage.selection[0]
        }

        var currentSize = target.width
        var scale2 = 16 / currentSize
        var thing = target.clone()
        thing.rescale(scale2)
        message.thumbnail = await thing.exportAsync(exportSettings)
        thing.remove()

        var icons = []

        for (let i = 0; i < iconExports.length; i++) {
          var icon = {
            image: "",
            size: iconExports[i].size
          }
          var temp = target.clone()
          var desiredSize = iconExports[i].size
          var scale = desiredSize / currentSize
          // var reversescale = currentSize / desiredSize

          temp.rescale(scale)
          icon.image = await temp.exportAsync(exportSettings)
          // target.rescale(reversescale)
          icons.push(icon)
          temp.remove()
        }

        message.icons = icons

        message.name = target.name

        figma.ui.postMessage(message)

      }
    }
  }
  // else {
  //   message = false
  //   figma.ui.postMessage(message)
  // }



}

figma.showUI(__html__);

figma.ui.resize(176 * 3, (176 * 2 + 48))

// Show preview when plugin runs
getImage()

// Update live preview
setInterval(() => {
  getImage(true)
}, 1000)

// Change preview on selection
// figma.on("selectionchange", () => {
//   getImage()
// })

figma.ui.onmessage = msg => {

  // Manual refresh
  if (msg.type === 'refresh') {
    getImage(true)
  }

  // Preview selected icon
  if (msg.type === 'select') {

    figma.once("selectionchange", () => {
      if (figma.currentPage.selection.length > 0) {

        getImage()

      }
    })



  }

};
