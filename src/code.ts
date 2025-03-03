import { getClientStorageAsync, setClientStorageAsync } from "@figlets/helpers";

// FIXME: When all sub children of a node are invisible export fails
// FIXME: Check if node exists (if has been deleted by user)
// FIXME: Select nearestIcon as currentIcon when shape inside icon selected and user first opens plugin

console.clear();

let scrollPos;

function nodeRemoved(node) {
	// Check if the node is undefined or null
	if (node) {
		let nodeToCheck = figma.getNodeById(node.id);

		if (nodeToCheck === null) {
			return true;
		}

		if (nodeToCheck?.parent === null) {
			return true;
		}
	}

	return false; // The node is still part of the document
}

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

function hexToRgb(hex) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16) / 255,
				g: parseInt(result[2], 16) / 255,
				b: parseInt(result[3], 16) / 255,
		  }
		: null;
}

function isBox(node) {
	return (
		node.type === "FRAME" ||
		node.type === "COMPONENT" ||
		node.type === "INSTANCE"
	);
}

// Check size to avoid exporting too large a preview
function isSmall(node) {
	return node.height <= 512 && node.width <= 512;
}

function areChildrenEmptyOrHidden(node: SceneNode): boolean {
	if (!("children" in node)) {
		// If the node doesn't have children, it's not applicable.
		return false;
	}

	return node.children.every((child) => {
		// Check if the child is visible and not empty
		const isHidden = !child.visible;
		const isEmpty =
			"children" in child
				? child.children.length === 0
				: isNodeEmpty(child);
		return isHidden || isEmpty;
	});
}

function isNodeEmpty(node: SceneNode): boolean {
	// Check if a node is considered "empty" (e.g., no meaningful content)
	if (node.type === "TEXT") {
		return node.characters.trim() === "";
	} else if (
		node.type === "FRAME" ||
		node.type === "GROUP" ||
		"children" in node
	) {
		return node.children.length === 0;
	}
	return false; // Other node types are not considered empty
}

var message, currentIcon, selectedIcon;

function isChildrenVisible(node) {
	var numberChildren = node.children.length;
	var numberChildrenHidden = 0;
	for (var i = 0; i < node.children.length; i++) {
		var child = node.children[i];
		if (!child.visible) numberChildrenHidden++;
	}

	if (numberChildren !== numberChildrenHidden) {
		return true;
	}
}
async function generateThumbnail(node) {
	var image;

	if (
		node.children &&
		node.children.length > 0 &&
		node.visible &&
		isChildrenVisible(node)
	) {
		if (!areChildrenEmptyOrHidden(node)) {
			image = await node.exportAsync({
				format: "SVG",
			});
		} else {
			console.log("node is not empty");
		}
	} else {
		if (!areChildrenEmptyOrHidden(node)) {
			if (figma.currentPage.selection.length === 1) {
				var nearestIcon = getNearestIcon(
					figma.currentPage.selection[0]
				);

				image = await nearestIcon.exportAsync({
					format: "SVG",
				});
			}
		}
	}

	return image;
}

async function getCurrentIconImage(node) {
	// currentIconThumbnail
	return await generateThumbnail(node);
}

function isInsideIcon(node) {
	if (isIcon(node)) {
		return node;
	} else {
		if (node) {
			if (node.parent && getNearestIcon(node.parent)) {
				return true;
			}
		}
	}
}

function getNearestIcon(node) {
	if (isIcon(node)) {
		return node;
	} else {
		if (node) {
			if (node.parent) {
				return getNearestIcon(node.parent);
			}
		}
	}
}

async function getSelectedIconImage(node) {
	if (node) {
		return await generateThumbnail(node, node.width, 16);
	}
}

function getParentFillOfSelectedNode(node): RGB {
	// Ensure the node exists
	if (!node) {
		const background = figma.currentPage.backgrounds[0] as SolidPaint;
		return background.color; // Fallback to canvas background if no node is provided
	}

	// // Check if the node's opacity is 0
	// if ('opacity' in node && node.opacity === 0) {
	// 	const parentNode = node.parent
	// 	return parentNode
	// 		? getParentFillOfSelectedNode(parentNode)
	// 		: figma.currentPage.backgrounds[0].color
	// }

	// Get the parent node
	const parentNode = node.parent;

	// If the parent node exists and has fills
	if (parentNode && "fills" in parentNode) {
		const fills = parentNode.fills as Paint[];

		// Check if fills exist and the first fill has a color
		if (fills.length > 0 && "color" in fills[0]) {
			const fill = fills[0].color;

			if (fill) {
				return fill; // Return the fill color if defined
			}
		}
	}

	// If no valid fill is found, recurse to the next parent or return canvas background
	if (parentNode) {
		return getParentFillOfSelectedNode(parentNode);
	} else {
		// No parent left, fallback to the canvas background color
		const background = figma.currentPage.backgrounds[0] as SolidPaint;
		return background.color;
	}
}

function getCanvasColor() {
	try {
		let hexColor = rgbToHex(getParentFillOfSelectedNode(currentIcon));

		return hexColor;
	} catch {}
}

function isSquare(node) {
	if (node.width === node.height) {
		return node;
	}
}

function isIcon(node) {
	if (node) {
		if (isSquare(node) && isSmall(node) && isBox(node)) {
			return node;
		}
	}
}

function isInsideContainer(node, container) {
	if (container && node) {
		if (
			container === "FRAME" ||
			container === "GROUP" ||
			container === "INSTANCE" ||
			container === "COMPONENT"
		) {
			return container.findOne((n) => n.id === node.id);
		}
	}
}

function debounce(func, wait, immediate?) {
	var timeout;
	return function () {
		var context = this,
			args = arguments;
		var later = function () {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

function setCurrentIcon(node?) {
	if (node) {
		currentIcon = node;
	} else {
		currentIcon = figma.currentPage.selection[0];
	}
}

function setPreview(node) {
	getSelectedIconImage(node).then((selectedImage) => {
		setCurrentIcon(node);
		figma.ui.postMessage({
			type: "GET_ICON",
			currentIconThumbnail: selectedImage,
			selectedIconThumbnail: selectedImage,
			canvasColor: getCanvasColor(),
		});
	});
}

function postIcon() {
	const selection = figma.currentPage.selection;
	const selectedItem = selection[0];
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
					var selectedIconThumbnail;
					if (figma.currentPage.selection[0].id !== currentIcon.id) {
						selectedIconThumbnail = selectedImage;
					}
					figma.ui.postMessage({
						type: "GET_ICON",
						currentIconThumbnail: currentImage,
						selectedIconThumbnail: currentImage,
						canvasColor: getCanvasColor(),
					});
				});
			}
		);
	}
}

function triggerNotification() {
	const selection = figma.currentPage.selection;
	let hasIssues = false;

	switch (selection.length) {
		case 0:
			figma.notify("Select an icon");
			hasIssues = true;
			break;

		case 1: {
			const selectedItem = selection[0];

			if (!isSmall(selectedItem)) {
				figma.notify("Icon must be 256px or smaller");
				hasIssues = true;
			}

			if (!isBox(selectedItem)) {
				figma.notify(
					"Selection must be a frame, group, component or instance"
				);
				hasIssues = true;
			}

			if (!isSquare(selectedItem)) {
				figma.notify("Selection must be square");
				hasIssues = true;
			}
			break;
		}

		default:
			figma.notify("Select one icon at a time");
			hasIssues = true;
			break;
	}

	// Proceed with additional logic only if no issues were found
	if (!hasIssues) {
		// Additional logic here if all conditions are met
	}
}

selectedIcon = figma.currentPage.selection[0];

var cachedSelectedThumbnail;
var cachedPreviewLocked;

// restore previous size
async function main() {
	var uiSize = (await getClientStorageAsync("uiSize")) || {
		width: 200,
		height: 200,
	};

	scrollPos = (await getClientStorageAsync("scrollPos")) || {
		top: 0,
		left: 0,
	};

	figma.showUI(__html__, { ...uiSize, themeColors: true });

	if (figma.currentPage.selection.length !== 1) {
		figma.notify("Select any square icon");
	}

	setCurrentIcon();
	if (currentIcon) {
		currentIcon.setRelaunchData({
			previewIcon: "Preview the currently selected icon",
		});
	}

	postIcon();

	// triggerNotification()

	figma.on("selectionchange", () => {
		if (nodeRemoved(currentIcon)) {
			console.log("node removed");
			figma.ui.postMessage({
				type: "GET_ICON",
				currentIconThumnail: undefined,
				selectedIconThumbnail: undefined,
			});
		}
		if (!cachedPreviewLocked) {
			if (figma.currentPage.selection.length === 1) {
				if (
					isInsideContainer(
						figma.currentPage.selection[0],
						currentIcon
					)
				) {
					cachedSelectedThumbnail = undefined;
					figma.ui.postMessage({
						type: "GET_ICON",
						selectedIconThumbnail: undefined,
						currentIconThumbnail: undefined,
						thumbnails: undefined,
					});
				} else {
					if (isIcon(figma.currentPage.selection[0])) {
						selectedIcon = figma.currentPage.selection[0];
						if (figma.currentPage.selection.length === 1) {
							if (isIcon(figma.currentPage.selection[0])) {
								setPreview(selectedIcon);
							}
						}
					} else {
						var nearestIcon = getNearestIcon(
							figma.currentPage.selection[0]
						);
						if (nearestIcon) {
							setPreview(nearestIcon);
						} else {
							cachedSelectedThumbnail = undefined;
						}
					}
				}
			} else {
				cachedSelectedThumbnail = undefined;
				// getSelectedIconImage(selectedIcon).then((selectedImage) => {
				// figma.ui.postMessage({
				// 	type: 'GET_ICON',
				// 	selectedIconThumbnail: undefined,
				// 	currentIconThumbnail: undefined,
				// 	thumbnails: undefined,
				// })

				// })
			}
		}
	});

	function getIcon() {
		if (nodeRemoved(currentIcon)) {
			figma.ui.postMessage({
				type: "GET_ICON",
				currentIconThumnail: undefined,
				selectedIconThumbnail: undefined,
			});
			return;
		}

		if (
			(currentIcon &&
				figma.getNodeById(currentIcon.id) &&
				isIcon(currentIcon)) ||
			getNearestIcon(currentIcon)
		) {
			getCurrentIconImage(currentIcon).then((currentImage) => {
				figma.ui.postMessage({
					type: "GET_ICON",
					currentIconThumbnail: currentImage,
					// selectedIconThumbnail: cachedSelectedThumbnail,
					canvasColor: getCanvasColor(),
					selectedIconThumbnail: currentImage,
				});
			});
		} else {
			figma.ui.postMessage({
				type: "GET_ICON",
				currentIconThumnail: undefined,
				canvasColor: getCanvasColor(),
				selectedIconThumbnail: undefined,
			});
		}
	}

	getIcon();

	function throttle(func, limit) {
		let lastFunc;
		let lastRan;
		return function () {
			const context = this;
			const args = arguments;
			if (!lastRan) {
				func.apply(context, args);
				lastRan = Date.now();
			} else {
				clearTimeout(lastFunc);
				lastFunc = setTimeout(function () {
					if (Date.now() - lastRan >= limit) {
						func.apply(context, args);
						lastRan = Date.now();
					}
				}, limit - (Date.now() - lastRan));
			}
		};
	}

	// Use it with `getIcon`
	const throttledGetIcon = throttle(getIcon, 500);
	setInterval(throttledGetIcon, 200);
}

export default function () {
	main();

	if (figma.command === "previewIcon") {
		main();
	}

	figma.ui.onmessage = async (msg) => {
		if (msg.type === "set-preview") {
			if (figma.currentPage.selection.length === 0) {
				setPreview(figma.currentPage.selection[0]);
			}
		}

		if (msg.type === "lock-preview") {
			if (!msg.locked) {
				if (figma.currentPage.selection.length === 1) {
					var nearestIcon = getNearestIcon(
						figma.currentPage.selection[0]
					);

					if (nearestIcon) {
						setPreview(nearestIcon);
					}
				}
			}
			cachedPreviewLocked = msg.locked;
		}

		if (msg.type === "resize") {
			figma.ui.resize(msg.size.width, msg.size.height);
			figma.clientStorage.setAsync("uiSize", msg.size);
		}

		if (msg.type === "scroll-position") {
			figma.clientStorage.setAsync("scrollPos", msg.pos);
		}

		if (msg.type === "UI_LOADED") {
			figma.ui.postMessage({
				type: "POST_SAVED_SCROLL_POS",
				pos: scrollPos,
			});
		}
	};
}
