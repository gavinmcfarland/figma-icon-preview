import { getClientStorageAsync, setClientStorageAsync } from '@figlets/helpers'

// FIXME: When all sub children of a node are invisible export fails
// TODO: Look for canvas color up the tree of frames

console.clear()

function componentToHex(c) {
	c = Math.floor(c * 255)
	var hex = c.toString(16)
	return hex.length == 1 ? '0' + hex : hex
}

function rgbToHex(rgb) {
	if (rgb) {
		let { r, g, b } = rgb
		return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
	}
}

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	return result
		? {
				r: parseInt(result[1], 16) / 255,
				g: parseInt(result[2], 16) / 255,
				b: parseInt(result[3], 16) / 255,
			}
		: null
}

var thumbnailSettings = [
	{
		size: 16,
		group: 'General',
	},
	{
		size: 24,
		group: 'General',
	},
	{
		size: 32,
		group: 'General',
	},
	{
		size: 48,
		group: 'General',
	},
	{
		size: 64,
		group: 'General',
	},
	{
		size: 96,
		group: 'General',
	},
	{
		size: 128,
		group: 'General',
	},
	{
		size: 20,
		group: 'iOS',
		label: 'Notification',
	},
	{
		size: 29,
		group: 'iOS',
		label: 'Settings',
	},
	{
		size: 40,
		group: 'iOS',
		label: 'Spotlight',
	},
	{
		size: 60,
		group: 'iOS',
		label: 'iPhone',
	},
	{
		size: 76,
		group: 'iOS',
		label: 'iPad',
	},
	{
		size: 83.5,
		group: 'iOS',
		label: 'iPad Pro',
	},
	{
		size: 16,
		group: 'Android',
		label: 'Small Contextual',
	},
	{
		size: 22,
		group: 'Android',
		label: 'Notification',
	},
	{
		size: 24,
		group: 'Android',
		label: 'System',
	},
	{
		size: 48,
		group: 'Android',
		label: 'Product',
	},
]

function isBox(node) {
	return (
		node.type === 'FRAME' ||
		node.type === 'COMPONENT' ||
		node.type === 'INSTANCE'
	)
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
	if (
		node.children &&
		node.children.length > 0 &&
		node.visible &&
		isChildrenVisible(node)
	) {
		image = await node.exportAsync({
			format: 'SVG',
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
	} else {
		if (node) {
			if (node.parent) {
				return getNearestIcon(node.parent)
			}
		}
	}
}

async function getSelectedIconImage(node) {
	if (node) {
		return await generateThumbnail(node, node.width, 16)
	}
}

function getCanvasColor() {
	var hex = rgbToHex(figma.currentPage.backgrounds[0].color)
	if (hex !== '#e5e5e5') {
		return hex
	} else {
		return '#ffffff'
	}
}

function isSquare(node) {
	if (node.width === node.height) {
		return node
	}
}

function isIcon(node) {
	if (node) {
		if (isSquare(node) && isSmall(node) && isBox(node)) {
			return node
		}
	}
}

function isInsideContainer(node, container) {
	if (container && node) {
		if (
			container === 'FRAME' ||
			container === 'GROUP' ||
			container === 'INSTANCE' ||
			container === 'COMPONENT'
		) {
			return container.findOne((n) => n.id === node.id)
		}
	}
}

function debounce(func, wait, immediate?) {
	var timeout
	return function () {
		var context = this,
			args = arguments
		var later = function () {
			timeout = null
			if (!immediate) func.apply(context, args)
		}
		var callNow = immediate && !timeout
		clearTimeout(timeout)
		timeout = setTimeout(later, wait)
		if (callNow) func.apply(context, args)
	}
}

function setCurrentIcon(node?) {
	if (node) {
		currentIcon = node
	} else {
		currentIcon = figma.currentPage.selection[0]
	}
}

function setPreview(node) {
	getSelectedIconImage(node).then((selectedImage) => {
		setCurrentIcon(node)
		figma.ui.postMessage({
			type: 'GET_ICON',
			currentIconThumbnail: selectedImage,
			thumbnails: thumbnailSettings,
			selectedIconThumbnail: selectedImage,
		})
	})
}

function postIcon(scrollPos) {
	const selection = figma.currentPage.selection
	const selectedItem = selection[0]
	if (
		selection &&
		selection.length === 1 &&
		isSmall(selectedItem) &&
		isBox(selectedItem) &&
		isSquare(selectedItem)
	) {
		getSelectedIconImage(figma.currentPage.selection[0]).then(
			(selectedImage) => {
				getCurrentIconImage(currentIcon).then((currentImage) => {
					var selectedIconThumbnail
					if (figma.currentPage.selection[0].id !== currentIcon.id) {
						selectedIconThumbnail = selectedImage
					}
					figma.ui.postMessage({
						type: 'GET_ICON',
						thumbnails: thumbnailSettings,
						currentIconThumbnail: currentImage,
						selectedIconThumbnail: currentImage,
						canvasColor: getCanvasColor(),
						scrollPos,
					})
				})
			},
		)
	}
}

function triggerNotification() {
	const selection = figma.currentPage.selection
	let hasIssues = false

	switch (selection.length) {
		case 0:
			figma.notify('Select an icon')
			hasIssues = true
			break

		case 1: {
			const selectedItem = selection[0]

			if (!isSmall(selectedItem)) {
				figma.notify('Icon must be 256px or smaller')
				hasIssues = true
			}

			if (!isBox(selectedItem)) {
				figma.notify(
					'Selection must be a frame, group, component or instance',
				)
				hasIssues = true
			}

			if (!isSquare(selectedItem)) {
				figma.notify('Selection must be square')
				hasIssues = true
			}
			break
		}

		default:
			figma.notify('Select one icon at a time')
			hasIssues = true
			break
	}

	// Proceed with additional logic only if no issues were found
	if (!hasIssues) {
		// Additional logic here if all conditions are met
	}
}

selectedIcon = figma.currentPage.selection[0]

var cachedSelectedThumbnail
var cachedScrollPos
var cachedUiSize
var cachedPreviewLocked

// restore previous size
async function main() {
	var uiSize = (await getClientStorageAsync('uiSize')) || {
		width: 352,
		height: 294,
	}
	var scrollPos = (await getClientStorageAsync('scrollPos')) || {
		top: 0,
		left: 0,
	}
	cachedUiSize = uiSize
	cachedScrollPos = cachedUiSize

	figma.showUI(__html__, { ...uiSize, themeColors: true })

	setCurrentIcon()
	if (currentIcon) {
		currentIcon.setRelaunchData({
			previewIcon: 'Preview the currently selected icon',
		})
	}

	postIcon(scrollPos)

	triggerNotification()

	figma.on('selectionchange', () => {
		if (!cachedPreviewLocked) {
			if (figma.currentPage.selection.length === 1) {
				if (
					isInsideContainer(
						figma.currentPage.selection[0],
						currentIcon,
					)
				) {
					cachedSelectedThumbnail = undefined
					figma.ui.postMessage({
						type: 'GET_ICON',
						selectedIconThumbnail: undefined,
						currentIconThumbnail: undefined,
						thumbnails: undefined,
					})
				} else {
					if (isIcon(figma.currentPage.selection[0])) {
						selectedIcon = figma.currentPage.selection[0]
						if (figma.currentPage.selection.length === 1) {
							if (isIcon(figma.currentPage.selection[0])) {
								setPreview(selectedIcon)
							}
						}
					} else {
						var nearestIcon = getNearestIcon(
							figma.currentPage.selection[0],
						)
						if (nearestIcon) {
							setPreview(nearestIcon)
						} else {
							cachedSelectedThumbnail = undefined
						}
					}
				}
			} else {
				cachedSelectedThumbnail = undefined
				// getSelectedIconImage(selectedIcon).then((selectedImage) => {
				figma.ui.postMessage({
					type: 'GET_ICON',
					selectedIconThumbnail: undefined,
					currentIconThumbnail: undefined,
					thumbnails: undefined,
				})

				// })
			}
		}
	})

	function getIcon() {
		if (
			currentIcon &&
			figma.getNodeById(currentIcon.id) &&
			(figma.currentPage.selection.length === 1 || cachedPreviewLocked)
		) {
			getCurrentIconImage(currentIcon).then((currentImage) => {
				figma.ui.postMessage({
					type: 'GET_ICON',
					currentIconThumbnail: currentImage,
					thumbnails: thumbnailSettings,
					// selectedIconThumbnail: cachedSelectedThumbnail,
					canvasColor: getCanvasColor(),
					selectedIconThumbnail: currentImage,
				})
			})
		} else {
			figma.ui.postMessage({
				type: 'GET_ICON',
				currentIconThumnail: undefined,
				thumbnails: thumbnailSettings,
				canvasColor: getCanvasColor(),
				selectedIconThumbnail: undefined,
			})
		}
	}

	getIcon()

	setInterval(() => {
		getIcon()
	}, 375)
}

export default function () {
	main()
	console.log(import.meta.env.MODE)

	if (figma.command === 'previewIcon') {
		main()
	}

	figma.ui.onmessage = (msg) => {
		if (msg.type === 'set-preview') {
			if (figma.currentPage.selection.length === 0) {
				setPreview(figma.currentPage.selection[0])
			}
		}

		if (msg.type === 'lock-preview') {
			if (!msg.locked) {
				if (figma.currentPage.selection.length === 1) {
					var nearestIcon = getNearestIcon(
						figma.currentPage.selection[0],
					)

					if (nearestIcon) {
						setPreview(nearestIcon)
					}
				}
			}
			cachedPreviewLocked = msg.locked
		}

		if (msg.type === 'resize') {
			figma.ui.resize(msg.size.width, msg.size.height)
			cachedUiSize = msg.size
		}

		if (msg.type === 'scroll-position') {
			cachedScrollPos = msg.pos
		}
	}

	figma.on('close', () => {
		setClientStorageAsync('uiSize', cachedUiSize)
		setClientStorageAsync('scrollPos', cachedScrollPos)
	})
}
