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
function componentToHex(c) {
    c = Math.floor(c * 255);
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(rgb) {
    if (rgb) {
        let { r, g, b } = rgb;
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }
}
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
function isBox(node) {
    return node.type === "FRAME" || node.type === "GROUP" || node.type === "COMPONENT" || node.type === "INSTANCE";
}
// Check size to avoid exporting too large a preview
function isSmall(node) {
    return node.height <= 512 && node.width <= 512;
}
var message, currentIcon, selectedIcon;
async function generateThumbnail(node, currentSize, desiredSize) {
    // var temp = node.clone()
    // temp.rescale(scale)
    var image = await node.exportAsync({
        format: "SVG",
        // constraint: {
        // 	type: "SCALE",
        // 	value: 2 * scale
        // }
    });
    image = String.fromCharCode.apply(null, image);
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
        message.currentIconThumbnail = await generateThumbnail(node, node.width);
        // Generate thumbnail previews
        for (let i = 0; i < thumbnailSettings.length; i++) {
            message.thumbnails.push({});
            message.thumbnails[i].size = thumbnailSettings[i].size;
            message.thumbnails[i].group = thumbnailSettings[i].group;
            message.thumbnails[i].label = thumbnailSettings[i].label;
        }
        // message.thumbnails = thumbnails
        message.name = node.name;
        return message;
    }
}
async function getThumbnailPreview(node) {
    if (node) {
        return await generateThumbnail(node, node.width);
    }
}
function getCanvasColor() {
    var hex = rgbToHex(figma.currentPage.backgrounds[0].color);
    if (hex !== "#e5e5e5") {
        return hex;
    }
    else {
        return "#ffffff";
    }
}
function isSquare(node) {
    if (node.width === node.height) {
        return node;
    }
}
function isIcon(node) {
    if (node) {
        if (isSquare(node)
            && isSmall(node)
            && isBox(node)) {
            return node;
        }
    }
}
function isInsideContainer(node, container) {
    return container.findOne(n => n.id === node.id);
}
// Show preview when plugin runs
// if (figma.command === "selected") {
var uiDimensions = {
    width: 176 * 3,
    height: 352
};
var scrollPos = {
    top: 0,
    left: 0
};
selectedIcon = figma.currentPage.selection[0];
// restore previous size
figma.clientStorage.getAsync('uiSize').then(size => {
    if (!size) {
        setClientStorageAsync("uiSize", uiDimensions);
        size = uiDimensions;
    }
    figma.clientStorage.getAsync('scrollPos').then((pos) => {
        // if (size) figma.ui.resize(size.w, size.h);
        if (!pos) {
            setClientStorageAsync("scrollPos", scrollPos);
            pos = scrollPos;
        }
        console.log(pos);
        if (figma.currentPage.selection.length === 1) {
            if (isSmall(figma.currentPage.selection[0])) {
                if (isBox(figma.currentPage.selection[0])) {
                    if (isSquare(figma.currentPage.selection[0])) {
                        // if (isSmall(figma.currentPage.selection[0])) {
                        figma.showUI(__html__, size);
                        currentIcon = figma.currentPage.selection[0];
                        getThumbnailPreview(figma.currentPage.selection[0]).then((thumbnail) => {
                            getThumbnails(currentIcon).then((msg) => {
                                var selectedIconThumbnail;
                                if (figma.currentPage.selection[0].id !== currentIcon.id) {
                                    selectedIconThumbnail = thumbnail;
                                }
                                figma.ui.postMessage(Object.assign(Object.assign({}, msg), { selectedIconThumbnail, canvasColor: getCanvasColor(), scrollPos: pos }));
                            });
                        });
                    }
                    else {
                        figma.closePlugin("Selection must be square");
                    }
                }
                else {
                    figma.closePlugin("Selection must be a frame, group, component or instance");
                }
            }
            else {
                figma.closePlugin("Icon must be 256px or smaller");
            }
        }
        else if (figma.currentPage.selection.length === 0) {
            figma.closePlugin("Select an icon");
        }
        else {
            figma.closePlugin("Select one icon at a time");
        }
    });
});
figma.ui.onmessage = msg => {
    // Manual refresh
    if (msg.type === 'set-preview') {
        if (selectedIcon) {
            currentIcon = selectedIcon;
        }
        else {
            currentIcon = figma.currentPage.selection[0];
        }
        getThumbnailPreview(selectedIcon).then((thumbnail) => {
            getThumbnails(currentIcon).then((msg) => {
                figma.ui.postMessage(Object.assign(Object.assign({}, msg), { selectedIconThumbnail: thumbnail }));
            });
        });
    }
    // Isnpect icon
    // if (msg.type === 'inspect') {
    // 	figma.once("selectionchange", () => {
    // 		if (figma.currentPage.selection.length === 1) {
    // 			if (nodeIsBox(figma.currentPage.selection[0])) {
    // 				if (nodeIsSmall(figma.currentPage.selection[0])) {
    // 					currentIcon = figma.currentPage.selection[0]
    // 						getThumbnailPreview(figma.currentPage.selection[0]).then((thumbnail) => {
    // 							getThumbnails(currentIcon).then((msg) => {
    // 								figma.ui.postMessage({ ...msg, selectedIconThumbnail: thumbnail })
    // 							})
    // 						})
    // 				}
    // 				else {
    // 					figma.notify("Frame must be smaller than 256px")
    // 				}
    // 			}
    // 			else {
    // 				figma.notify("Selection must be a frame or group to preview")
    // 			}
    // 		}
    // 		else {
    // 			figma.notify("Please select one group or frame")
    // 		}
    // 	})
    // }
    if (msg.type === 'resize') {
        figma.ui.resize(msg.size.width, msg.size.height);
        figma.clientStorage.setAsync('uiSize', msg.size).catch(err => { }); // save size
    }
    if (msg.type === 'scroll-position') {
        figma.clientStorage.setAsync('scrollPos', msg.pos).catch(err => { }); // save scroll pos
    }
};
figma.on('selectionchange', () => {
    if (figma.currentPage.selection.length === 1) {
        if (isInsideContainer(figma.currentPage.selection[0], currentIcon)) {
            figma.ui.postMessage({
                selectedIconThumbnail: undefined
            });
        }
        else {
            if (figma.currentPage.selection[0].width === figma.currentPage.selection[0].height) {
                selectedIcon = figma.currentPage.selection[0];
            }
            if (figma.currentPage.selection[0].width === figma.currentPage.selection[0].height) {
                if (figma.currentPage.selection.length === 1) {
                    if (isIcon(figma.currentPage.selection[0])) {
                        getThumbnailPreview(selectedIcon).then((thumbnail) => {
                            var selectedIconThumbnail;
                            if (figma.currentPage.selection[0].id !== currentIcon.id) {
                                selectedIconThumbnail = thumbnail;
                            }
                            else {
                                selectedIconThumbnail = undefined;
                            }
                            figma.ui.postMessage({
                                selectedIconThumbnail
                            });
                        });
                    }
                }
            }
        }
    }
    else {
        // getThumbnailPreview(selectedIcon).then((thumbnail) => {
        figma.ui.postMessage({
            selectedIconThumbnail: undefined
        });
        // })
    }
});
// Update live preview. Disabled for now because no way to prevent Figma from hiding canvas UI when node is changed.
// Disabled also because slows down Figma/computer
setInterval(() => {
    if (selectedIcon) {
        getThumbnailPreview(selectedIcon).then((thumbnail) => {
            var selectedIconThumbnail;
            if (isIcon(figma.currentPage.selection[0])) {
                if (figma.currentPage.selection.length === 1) {
                    if (isInsideContainer(figma.currentPage.selection[0], currentIcon)) {
                        selectedIconThumbnail = undefined;
                    }
                    else if (figma.currentPage.selection[0].id !== currentIcon.id) {
                        selectedIconThumbnail = thumbnail;
                    }
                }
            }
            getThumbnails(currentIcon).then((msg) => {
                figma.ui.postMessage(Object.assign(Object.assign({}, msg), { selectedIconThumbnail, canvasColor: getCanvasColor() }));
            });
        });
    }
    // if (currentIcon) {
    // 	getThumbnails(currentIcon).then((msg) => {
    // 		figma.ui.postMessage({ ...msg })
    // 	})
    // }
}, 300);
