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

const ui = {
	width: 176 * 3,
	height: (176 * 2 + 48)
}

const exportSettings = {
	format: "PNG",
	constraint: {
		type: "SCALE",
		value: 2
	}
}

function nodeIsBox(node) {
	return node.type === "FRAME" || node.type === "GROUP" || node.type === "COMPONENT" || node.type === "INSTANCE"
}

// Check size to avoid exporting too large a preview
function nodeIsSmall(node) {
	return node.height <= 256 && node.width <= 256
}

var message, lastSelectedNode, imageBytes

async function generateThumbnail(node, currentSize, desiredSize) {

	var scale = desiredSize / currentSize
	var temp = node.clone()

	temp.rescale(scale)

	var image = await temp.exportAsync(exportSettings)

	temp.remove()

	return image
}

async function setPreview(selection, refresh?) {

	var currentNode = selection[0]

	if (refresh) {
		currentNode = lastSelectedNode
		if (lastSelectedNode.removed) {
			figma.notify("Node was removed")
		}
	} else {
		currentNode = figma.currentPage.selection[0]
	}

	if (currentNode) {
		// Save current node for when preview is refeshed
		if (!refresh) {
			lastSelectedNode = figma.currentPage.selection[0]
		}

		message = {
			thumbnail: {},
			thumbnails: [],
			name: ""
		}

		// Generate thumbnail for current frame
		message.thumbnail.current = await generateThumbnail(currentNode, currentNode.width, 16)

		// Generate thumbnail previews
		for (let i = 0; i < thumbnailSettings.length; i++) {
			message.thumbnails.push({})
			message.thumbnails[i].image = ""
			message.thumbnails[i].size = thumbnailSettings[i].size
			message.thumbnails[i].group = thumbnailSettings[i].group
			message.thumbnails[i].label = thumbnailSettings[i].label
			message.thumbnails[i].image = await generateThumbnail(currentNode, currentNode.width, thumbnailSettings[i].size)
		}

		// message.thumbnails = thumbnails
		message.name = currentNode.name
		figma.ui.postMessage(message)
	}

}

// Show preview when plugin runs
// if (figma.command === "selected") {

if (figma.currentPage.selection.length === 1) {
	if (nodeIsBox(figma.currentPage.selection[0])) {
		if (nodeIsSmall(figma.currentPage.selection[0])) {
			figma.showUI(__html__);
			figma.ui.resize(ui.width, ui.height)
			setPreview(figma.currentPage.selection)
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
	figma.ui.resize(ui.width, ui.height)
	setPreview(figma.currentPage.selection)
	message = false
	figma.ui.postMessage(message)
}
else {
	figma.notify("Please select one group or frame")
	figma.closePlugin()
}

// Update live preview. Disabled for now because no way to prevent Figma from hiding canvas UI when node is changed.
// setInterval(() => {
//   setPreview(true)
// }, 1000)
// }

figma.ui.onmessage = msg => {

	// Manual refresh
	if (msg.type === 'refresh') {
		setPreview(figma.currentPage.selection, true)
	}


	// Isnpect icon
	if (msg.type === 'inspect') {

		figma.once("selectionchange", () => {
			if (figma.currentPage.selection.length === 1) {
				if (nodeIsBox(figma.currentPage.selection[0])) {
					if (nodeIsSmall(figma.currentPage.selection[0])) {
						console.log(figma.currentPage.selection[0].height)
						setPreview(figma.currentPage.selection[0])
					}
					else {
						figma.notify("Frame must be smaller than 256px")
					}
				}
				else {
					figma.notify("Selection must be a frame or group to preview")
				}
			}
			else {
				figma.notify("Please select one group or frame")
			}
		})
	}

};
