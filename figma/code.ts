import { getClientStorageAsync, setClientStorageAsync } from '@figlets/helpers'

// FIXME: When all sub children of a node are invisible export fails
// TODO: Look for canvas color up the tree of frames

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

function isBox(node) {
	return node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE"
}

// Check size to avoid exporting too large a preview
function isSmall(node) {
	return node.height <= 512 && node.width <= 512
}

var message, currentIcon, selectedIcon

function isChildrenVisible(node) {

	var numberChildren = node.children.length
	var numberChildrenHidden = 0
	for (var i = 0; i < node.children.length; i++) {
		var child = node.children[i]
		if (!child.visible) numberChildrenHidden++
	}

	if (numberChildren !== numberChildrenHidden) {
		return true
	}
}
async function generateThumbnail(node) {

	var image
	if (node.children && node.children.length > 0 && node.visible && isChildrenVisible(node)) {
		image = await node.exportAsync({
			format: "SVG"
		})
	}

	return image
}

async function getCurrentIconImage(node) {
	// currentIconThumbnail
	return await generateThumbnail(node)
}

function getNearestIcon(node) {
	if (isIcon(node)) {
		return node
	}
	else {
		if (node.parent) {
			return getNearestIcon(node.parent)
		}
	}
}


// async function getCurrentIconImage(node, refresh?) {

// 	if (node) {
// 		message = {
// 			thumbnails: []
// 		}

// 		message.currentIconThumbnail = await generateThumbnail(node)

// 		for (let i = 0; i < thumbnailSettings.length; i++) {
// 			message.thumbnails.push({})
// 			message.thumbnails[i].size = thumbnailSettings[i].size
// 			message.thumbnails[i].group = thumbnailSettings[i].group
// 			message.thumbnails[i].label = thumbnailSettings[i].label
// 		}

// 		return message
// 	}

// }

async function getSelectedIconImage(node) {

	if (node) {
		return await generateThumbnail(node, node.width, 16)
	}

}

function getCanvasColor() {
	var hex = rgbToHex(figma.currentPage.backgrounds[0].color)
	if (hex !== "#e5e5e5") {
		return hex
	}
	else {
		return "#ffffff"
	}
}

function isSquare(node) {
	if (node.width === node.height) {
		return node
	}
}

function isIcon(node) {
	if (node) {
		if (isSquare(node)
			&& isSmall(node)
			&& isBox(node)) {
			return node
		}
	}
}

function isInsideContainer(node, container) {
	if (container && node) {
		if (container === "FRAME" || container === "GROUP" || container === "INSTANCE" || container === "COMPONENT") {
			return container.findOne(n => n.id === node.id)
		}

	}
}

function debounce(func, wait, immediate?) {
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

function setCurrentIcon(node?) {
	if (node) {
		currentIcon = node
	}
	else {
		currentIcon = figma.currentPage.selection[0]
	}

}

function setPreview(node) {
	getSelectedIconImage(node).then((selectedImage) => {
		if (!cachedPreviewLocked) {
			setCurrentIcon(node)
			figma.ui.postMessage({
				currentIconThumbnail: selectedImage,
				thumbnails: thumbnailSettings
			})
		}
	})
}

selectedIcon = figma.currentPage.selection[0]

var cachedSelectedThumbnail;
var cachedScrollPos;
var cachedUiSize;
var cachedPreviewLocked;

// restore previous size
async function main() {

	var uiSize = await getClientStorageAsync('uiSize') || { width: 328, height: 254 }
	var scrollPos = await getClientStorageAsync('scrollPos') || { top: 0, left: 0 }
	cachedUiSize = uiSize
	cachedScrollPos = cachedUiSize


	if (figma.currentPage.selection.length === 1) {
		if (isSmall(figma.currentPage.selection[0])) {
			if (isBox(figma.currentPage.selection[0])) {
				if (isSquare(figma.currentPage.selection[0])) {





					figma.showUI(__html__, uiSize);

					setCurrentIcon()
					// currentIcon.setRelaunchData({ previewIcon: 'Preview the currently selected icon' })

					getSelectedIconImage(figma.currentPage.selection[0]).then((selectedImage) => {
						getCurrentIconImage(currentIcon).then((currentImage) => {
							var selectedIconThumbnail
							if (figma.currentPage.selection[0].id !== currentIcon.id) {
								selectedIconThumbnail = selectedImage
							}
							figma.ui.postMessage({ thumbnails: thumbnailSettings, currentIconThumbnail: currentImage, selectedIconThumbnail, canvasColor: getCanvasColor(), scrollPos })
						})
					})



				}
				else {
					figma.closePlugin("Selection must be square")
				}
			}
			else {
				figma.closePlugin("Selection must be a frame, group, component or instance")
			}
		}
		else {
			figma.closePlugin("Icon must be 256px or smaller")
		}
	}
	else if (figma.currentPage.selection.length === 0) {
		figma.closePlugin("Select an icon")
	}
	else {
		figma.closePlugin("Select one icon at a time")
	}


	figma.on('selectionchange', () => {

		if (figma.currentPage.selection.length === 1) {
			if (isInsideContainer(figma.currentPage.selection[0], currentIcon)) {
				cachedSelectedThumbnail = undefined
				figma.ui.postMessage({
					selectedIconThumbnail: undefined
				})
			}
			else {
				if (isIcon(figma.currentPage.selection[0])) {
					selectedIcon = figma.currentPage.selection[0]
					if (figma.currentPage.selection.length === 1) {
						if (isIcon(figma.currentPage.selection[0])) {
							setPreview(selectedIcon)
						}
					}
				}
				else {
					var nearestIcon = getNearestIcon(figma.currentPage.selection[0])
					if (nearestIcon) {
						setPreview(nearestIcon)
					}
					else {
						cachedSelectedThumbnail = undefined
					}

				}
			}

		}
		else {
			cachedSelectedThumbnail = undefined
			// getSelectedIconImage(selectedIcon).then((selectedImage) => {
			figma.ui.postMessage({
				selectedIconThumbnail: undefined
			})
			// })
		}
	})


	setInterval(() => {
		if (currentIcon && figma.getNodeById(currentIcon.id)) {

			getCurrentIconImage(currentIcon).then((currentImage) => {
				figma.ui.postMessage({
					thumbnails: thumbnailSettings,
					currentIconThumbnail: currentImage,
					// selectedIconThumbnail: cachedSelectedThumbnail,
					canvasColor: getCanvasColor()
				})
			})

		}
		else {
			figma.ui.postMessage({ currentIconThumnail: undefined, thumbnails: thumbnailSettings, canvasColor: getCanvasColor() })
		}

	}, 375 )

}

main()

if (figma.command === "previewIcon") {
	main()
}

figma.ui.onmessage = msg => {

	if (msg.type === 'set-preview') {
		if (figma.currentPage.selection.length === 0) {
			setPreview(figma.currentPage.selection[0])
		}
	}

	if (msg.type === 'lock-preview') {
		if (!msg.locked) {
			var nearestIcon = getNearestIcon(figma.currentPage.selection[0])

			if (nearestIcon) {
				setPreview(nearestIcon)
			}
		}
		cachedPreviewLocked = msg.locked
	}

	if (msg.type === 'resize') {
		figma.ui.resize(msg.size.width, msg.size.height);
		cachedUiSize = msg.size
	}

	if (msg.type === 'scroll-position') {
		cachedScrollPos = msg.pos
	}

};

figma.on('close', () => {
	setClientStorageAsync('uiSize', cachedUiSize)
	setClientStorageAsync('scrollPos', cachedScrollPos);
})
