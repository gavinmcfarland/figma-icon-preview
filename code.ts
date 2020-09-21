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
    size: 24
  },
  {
    size: 32
  },
  {
    size: 64
  },
  {
    size: 96
  }
]

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

        var images = []

        for (let i = 0; i < iconExports.length; i++) {
          var temp = target.clone()
          var currentSize = target.width
          var desiredSize = iconExports[i].size
          var scale = desiredSize / currentSize

          temp.rescale(scale)
          var image = await temp.exportAsync(exportSettings)
          images.push(image)
          temp.remove()
        }

        figma.ui.postMessage(images)

      }
    }
  }



}

figma.showUI(__html__);

figma.ui.resize(480, (256 - 32))

// Show preview when plugin runs
getImage()

// Update live preview
// setInterval(() => {
//   getImage(true)
// }, 250)

// Change preview on selection
figma.on("selectionchange", () => {
  getImage()
})

figma.ui.onmessage = msg => {

  // Manual refresh
  if (msg.type === 'refresh') {
    getImage(true)
  }

  // Preview selected icon
  if (msg.type === 'select') {
    figma.once("selectionchange", () => {
      getImage()
    })
  }

};
