'use strict';

/**
 * Helpers which make it easier to update client storage
 */
function setClientStorageAsync(key, data) {
  return figma.clientStorage.setAsync(key, data);
}

const eventListeners = [];

figma.ui.onmessage = message => {
  for (let eventListener of eventListeners) {
    if (message.action === eventListener.action) eventListener.callback(message.data);
  }
};

console.clear();
var thumbnailSettings = [
    {
        size: 16,
        group: "General"
    },
    {
        size: 24,
        group: "General"
    },
    {
        size: 32,
        group: "General"
    },
    {
        size: 48,
        group: "General"
    },
    {
        size: 64,
        group: "General"
    },
    {
        size: 96,
        group: "General"
    },
    {
        size: 128,
        group: "General"
    },
    {
        size: 20,
        group: "iOS",
        label: "Notification"
    },
    {
        size: 29,
        group: "iOS",
        label: "Settings"
    },
    {
        size: 40,
        group: "iOS",
        label: "Spotlight"
    },
    {
        size: 60,
        group: "iOS",
        label: "iPhone"
    },
    {
        size: 76,
        group: "iOS",
        label: "iPad"
    },
    {
        size: 83.5,
        group: "iOS",
        label: "iPad Pro"
    },
    {
        size: 16,
        group: "Android",
        label: "Small Contextual"
    },
    {
        size: 22,
        group: "Android",
        label: "Notification"
    },
    {
        size: 24,
        group: "Android",
        label: "System"
    },
    {
        size: 48,
        group: "Android",
        label: "Product"
    }
];
function nodeIsBox(node) {
    return node.type === "FRAME" || node.type === "GROUP" || node.type === "COMPONENT" || node.type === "INSTANCE";
}
// Check size to avoid exporting too large a preview
function nodeIsSmall(node) {
    return node.height <= 256 && node.width <= 256;
}
var message, currentlySelectedIcon;
async function generateThumbnail(node, currentSize, desiredSize) {
    var scale = desiredSize / currentSize;
    // var temp = node.clone()
    // temp.rescale(scale)
    var image = await node.exportAsync({
        format: "PNG",
        constraint: {
            type: "SCALE",
            value: 2 * scale
        }
    });
    // temp.remove()
    return image;
}
async function getThumbnails(node, refresh) {
    if (node) {
        // Save current node for when preview is refeshed
        // if (!refresh) {
        // 	lastSelectedNode = figma.currentPage.selection[0]
        // }
        message = {
            thumbnail: {},
            thumbnails: [],
            name: ""
        };
        // Generate thumbnail for current frame
        message.thumbnail.current = await generateThumbnail(node, node.width, 16);
        // Generate thumbnail previews
        for (let i = 0; i < thumbnailSettings.length; i++) {
            message.thumbnails.push({});
            message.thumbnails[i].image = "";
            message.thumbnails[i].size = thumbnailSettings[i].size;
            message.thumbnails[i].group = thumbnailSettings[i].group;
            message.thumbnails[i].label = thumbnailSettings[i].label;
            message.thumbnails[i].image = await generateThumbnail(node, node.width, thumbnailSettings[i].size);
        }
        // message.thumbnails = thumbnails
        message.name = node.name;
        return message.thumbnails;
    }
}
async function getThumbnailPreview(node) {
    if (node) {
        return await generateThumbnail(node, node.width, 16);
    }
}
// Show preview when plugin runs
// if (figma.command === "selected") {
var uiDimensions = {
    width: 176 * 3,
    height: (176 * 2 + 48)
};
// restore previous size
figma.clientStorage.getAsync('uiSize').then(size => {
    // if (size) figma.ui.resize(size.w, size.h);
    if (!size) {
        setClientStorageAsync("uiSize", uiDimensions);
        size = uiDimensions;
    }
    if (figma.currentPage.selection.length === 1) {
        if (nodeIsBox(figma.currentPage.selection[0])) {
            if (nodeIsSmall(figma.currentPage.selection[0])) {
                figma.showUI(__html__, size);
                currentlySelectedIcon = figma.currentPage.selection[0];
                getThumbnailPreview(figma.currentPage.selection[0]).then((thumbnail) => {
                    getThumbnails(currentlySelectedIcon).then((thumbnails) => {
                        figma.ui.postMessage({ thumbnails, selectedIconThumbnail: thumbnail });
                    });
                });
            }
            else {
                figma.notify("Frame must be smaller than 256px");
                figma.closePlugin();
            }
        }
        else {
            figma.notify("Selection must be a frame or group to preview");
            figma.closePlugin();
        }
    }
    else if (figma.currentPage.selection.length === 0) {
        figma.showUI(__html__);
        getThumbnails(figma.currentPage.selection[0]);
        message = false;
        figma.ui.postMessage(message);
    }
    else {
        figma.notify("Please select one group or frame");
        figma.closePlugin();
    }
});
// Update live preview. Disabled for now because no way to prevent Figma from hiding canvas UI when node is changed.
// Disabled also because slows down Figma/computer
// setInterval(() => {
// 	getThumbnailPreview(figma.currentPage.selection[0]).then((thumbnail) => {
// 		getThumbnails(currentlySelectedIcon).then((thumbnails) => {
// 			figma.ui.postMessage({ thumbnails, selectedIconThumbnail: thumbnail })
// 		})
// 	})
// }, 1200)
figma.ui.onmessage = msg => {
    // Manual refresh
    if (msg.type === 'set-preview') {
        currentlySelectedIcon = figma.currentPage.selection[0];
        getThumbnailPreview(figma.currentPage.selection[0]).then((thumbnail) => {
            getThumbnails(currentlySelectedIcon).then((thumbnails) => {
                figma.ui.postMessage({ thumbnails, selectedIconThumbnail: thumbnail });
            });
        });
    }
    // Isnpect icon
    if (msg.type === 'inspect') {
        figma.once("selectionchange", () => {
            if (figma.currentPage.selection.length === 1) {
                if (nodeIsBox(figma.currentPage.selection[0])) {
                    if (nodeIsSmall(figma.currentPage.selection[0])) {
                        currentlySelectedIcon = figma.currentPage.selection[0];
                        getThumbnailPreview(figma.currentPage.selection[0]).then((thumbnail) => {
                            getThumbnails(currentlySelectedIcon).then((thumbnails) => {
                                figma.ui.postMessage({ thumbnails, selectedIconThumbnail: thumbnail });
                            });
                        });
                    }
                    else {
                        figma.notify("Frame must be smaller than 256px");
                    }
                }
                else {
                    figma.notify("Selection must be a frame or group to preview");
                }
            }
            else {
                figma.notify("Please select one group or frame");
            }
        });
    }
    if (msg.type === 'resize') {
        figma.ui.resize(msg.size.width, msg.size.height);
        figma.clientStorage.setAsync('uiSize', msg.size).catch(err => { }); // save size
    }
};
figma.on('selectionchange', () => {
    console.log("selection changed");
    getThumbnailPreview(figma.currentPage.selection[0]).then((thumbnail) => {
        figma.ui.postMessage({
            selectedIconThumbnail: thumbnail
        });
    });
});
