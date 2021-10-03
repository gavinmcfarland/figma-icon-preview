import { setClientStorageAsync } from '@figlets/helpers'

console.clear()

function componentToHex(c) {
	c = Math.floor(c * 255)
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgb) {
	if (rgb) {
		let { r, g, b } = rgb
		return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	}
}

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16) / 255,
		g: parseInt(result[2], 16) / 255,
		b: parseInt(result[3], 16) / 255
	} : null;
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

]

function nodeIsBox(node) {
	return node.type === "FRAME" || node.type === "GROUP" || node.type === "COMPONENT" || node.type === "INSTANCE"
}

// Check size to avoid exporting too large a preview
function nodeIsSmall(node) {
	return node.height <= 256 && node.width <= 256
}

var message, lastSelectedIcon, imageBytes, currentIcon, selectedIcon

async function generateThumbnail(node, currentSize?, desiredSize?) {

	var scale = desiredSize / currentSize
	var revertScale = currentSize / desiredSize
	// var temp = node.clone()
	// temp.rescale(scale)

	var image = await node.exportAsync({
		format: "SVG",
		// constraint: {
		// 	type: "SCALE",
		// 	value: 2 * scale
		// }
	})

	image = String.fromCharCode.apply(null, image)

	// temp.remove()

	return image
}

async function getThumbnails(node, refresh?) {

	if (node) {
		// Save current node for when preview is refeshed
		// if (!refresh) {
		// 	lastSelectedNode = figma.currentPage.selection[0]
		// }

		message = {
			thumbnail: {},
			thumbnails: [],
			name: ""
		}

		message.currentIconThumbnail = await generateThumbnail(node, node.width, 84)

		// Generate thumbnail previews
		for (let i = 0; i < thumbnailSettings.length; i++) {
			message.thumbnails.push({})
			message.thumbnails[i].size = thumbnailSettings[i].size
			message.thumbnails[i].group = thumbnailSettings[i].group
			message.thumbnails[i].label = thumbnailSettings[i].label
		}

		// message.thumbnails = thumbnails
		message.name = node.name
		return message
	}

}

async function getThumbnailPreview(node) {

	if (node) {
		return await generateThumbnail(node, node.width, 16)
	}

}

function getCanvasColor() {
	var hex = rgbToHex(figma.currentPage.backgrounds[0].color)
	console.log(hex)
	if (hex !== "#e5e5e5") {
		return hex
	}
}

function isIcon(node) {
	if (node) {
		if ((node.width === node.height) && (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "GROUP")) {
			return node
		}
	}
}

function isInsideContainer(node, container) {
	return container.findOne(n => n.id === node.id)
}

// Show preview when plugin runs
// if (figma.command === "selected") {

var uiDimensions = {
	width: 176 * 3,
	height: (176 * 2 + 48)
}

selectedIcon = figma.currentPage.selection[0]

// restore previous size
figma.clientStorage.getAsync('uiSize').then(size => {
	// if (size) figma.ui.resize(size.w, size.h);

	if (!size) {
		setClientStorageAsync("uiSize", uiDimensions)
		size = uiDimensions
	}

	if (figma.currentPage.selection.length === 1) {
		if (nodeIsBox(figma.currentPage.selection[0])) {
			if (nodeIsSmall(figma.currentPage.selection[0])) {
				if (isIcon(figma.currentPage.selection[0])) {

						figma.showUI(__html__, size);
						currentIcon = figma.currentPage.selection[0]
						getThumbnailPreview(figma.currentPage.selection[0]).then((thumbnail) => {
							getThumbnails(currentIcon).then((msg) => {
								var selectedIconThumbnail
								if (figma.currentPage.selection[0].id !== currentIcon.id) {
									selectedIconThumbnail = thumbnail
								}
								figma.ui.postMessage({ ...msg, selectedIconThumbnail, canvasColor: getCanvasColor() })
							})
						})


				}



			}
			else {
				figma.notify("Frame must be smaller than 256px")
				figma.closePlugin()
			}
		}
		else {
			figma.notify("Selection must be a frame or group to preview")
			figma.closePlugin()
		}
	}
	else if (figma.currentPage.selection.length === 0) {
		figma.showUI(__html__);
		getThumbnails(figma.currentPage.selection[0])
		message = false
		figma.ui.postMessage(message)
	}
	else {
		figma.notify("Please select one group or frame")
		figma.closePlugin()
	}
})




figma.ui.onmessage = msg => {


	// Manual refresh
	if (msg.type === 'set-preview') {
		if (selectedIcon) {
			currentIcon = selectedIcon
		}
		else {
			currentIcon = figma.currentPage.selection[0]
		}

		getThumbnailPreview(selectedIcon).then((thumbnail) => {
			getThumbnails(currentIcon).then((msg) => {
				figma.ui.postMessage({ ...msg, selectedIconThumbnail: thumbnail })
			})
		})
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
		figma.clientStorage.setAsync('uiSize', msg.size).catch(err => { });// save size
	}

};

figma.on('selectionchange', () => {
	console.log("selection changed")
	if (figma.currentPage.selection.length === 1) {
		if (isInsideContainer(figma.currentPage.selection[0], currentIcon)) {
			figma.ui.postMessage({
				selectedIconThumbnail: undefined
			})
		}
		else {
			if (figma.currentPage.selection[0].width === figma.currentPage.selection[0].height) {
				selectedIcon = figma.currentPage.selection[0]
			}
			if (figma.currentPage.selection[0].width === figma.currentPage.selection[0].height) {
				if (figma.currentPage.selection.length === 1) {
					if (isIcon(figma.currentPage.selection[0])) {
						getThumbnailPreview(selectedIcon).then((thumbnail) => {
							var selectedIconThumbnail
							if (figma.currentPage.selection[0].id !== currentIcon.id) {
								selectedIconThumbnail = thumbnail
							}
							else {
								selectedIconThumbnail = undefined
							}
							figma.ui.postMessage({
								selectedIconThumbnail
							})
						})
					}
				}
			}
		}

	}
	else {
		// getThumbnailPreview(selectedIcon).then((thumbnail) => {
			figma.ui.postMessage({
				selectedIconThumbnail: undefined
			})
		// })
	}
})


// Update live preview. Disabled for now because no way to prevent Figma from hiding canvas UI when node is changed.
// Disabled also because slows down Figma/computer
setInterval(() => {
	console.log("updated preview")
	if (selectedIcon) {
		console.log("selectedIcon", selectedIcon)


		getThumbnailPreview(selectedIcon).then((thumbnail) => {
			var selectedIconThumbnail
			if (isIcon(figma.currentPage.selection[0])) {
				if (figma.currentPage.selection.length > 0) {
					if (isInsideContainer(figma.currentPage.selection[0], currentIcon)) {
						selectedIconThumbnail = undefined
					}
					else if (figma.currentPage.selection[0].id !== currentIcon.id) {
						selectedIconThumbnail = thumbnail
					}
				}
			}

			getThumbnails(currentIcon).then((msg) => {
				figma.ui.postMessage({ ...msg, selectedIconThumbnail })
			})
		})


	}

	// if (currentIcon) {
	// 	getThumbnails(currentIcon).then((msg) => {
	// 		figma.ui.postMessage({ ...msg })
	// 	})
	// }


}, 300)
