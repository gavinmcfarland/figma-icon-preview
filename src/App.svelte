<script lang="ts">
	// import Field from './Field.svelte'
	import { onMount } from 'svelte'
	import './reset.css'

	export const name: string = ''
	let root;
	let toolbar;
	let message
	let canvas2
	let thumbnail
	let preview
	let canvasColor = "#ffffff"
	let oppositeColor;
	let selectedIconThumbnail
	let thumbnailWrapper


	function resize(node, event) {


		function resizeWindow(event) {
			const size = {
			width: Math.max(50,Math.floor(event.clientX+5)),
			height: Math.max(50,Math.floor(event.clientY+5))
			};
			parent.postMessage( { pluginMessage: { type: 'resize', size: size }}, '*');
		}
		node.onpointerdown = (e)=>{
			corner.onpointermove = resizeWindow;
			corner.setPointerCapture(e.pointerId);
		};
		node.onpointerup = (e)=>{
			corner.onpointermove = null;
			corner.releasePointerCapture(e.pointerId);
		};

		// corner.onpointerdown = (e)=>{
		// 	corner.onpointermove = resizeWindow;
		// 	corner.setPointerCapture(e.pointerId);
		// };
		// corner.onpointerup = (e)=>{
		// 	corner.onpointermove = null;
		// 	corner.releasePointerCapture(e.pointerId);
		// };
	}

	async function figmaImageDataToCanvas(data: Uint8Array): Promise<HTMLCanvasElement> {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const url = URL.createObjectURL(new Blob([data]));
		const image: HTMLImageElement = await new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = () => reject();
			img.src = url;
		});
		canvas.width = image.width;
		canvas.height = image.height;
		ctx.drawImage(image, 0, 0);
    return canvas;
	}

	async function decodeImage(canvas, ctx, bytes, size) {
		var scale = 1;
		const url = URL.createObjectURL(new Blob([bytes]))

		const image = await new Promise((resolve, reject) => {
			const img = new Image()
			img.onload = () => resolve(img)
			img.onerror = () => reject()
			img.src = url
		})

		canvas.width = image.width
		canvas.height = image.height
		canvas.style.width = size + 'px'
		canvas.style.height = size + 'px'
		ctx.drawImage(image, 0, 0)
		const imageData = ctx.getImageData(0, 0, image.width, image.height)
		return imageData
	}

	function setPreview() {
		selectedIconThumbnail = undefined
		parent.postMessage({ pluginMessage: { type: 'set-preview' } }, '*')
	}

	// onMount(() => {
	// 	const thumbnails = root.querySelector('#thumbnails')


	// 	window.onmessage = async (event) => {
	// 		message = event.data.pluginMessage

	// 		// console.log(message)

	// 		if (message) {

	// 			if (message.selectedIconThumbnail) {
	// 				const ctx2 = canvas2.getContext('2d')
	// 				await decodeImage(canvas2, ctx2, message.selectedIconThumbnail)
	// 				preview.classList.add('show')
	// 				thumbnail.appendChild(canvas2)
	// 				thumbnail.children[0].parentNode.replaceChild(canvas2, thumbnail.children[0])
	// 			}
	// 			else {
	// 				preview.classList.remove('show')
	// 			}

	// 			if (message.thumbnails) {
	// 				// iconName.innerHTML = message.name
	// 				console.log(message.thumbnails)




	// 				for (let i = 0; i < message.thumbnails.length; i++) {
	// 					if (thumbnails.children[i]) {
	// 						const canvas = document.createElement('canvas')

	// 						const ctx = canvas.getContext('2d')

	// 						var bytes = message.thumbnails[i].image

	// 						await decodeImage(canvas, ctx, bytes)

	// 						thumbnails.children[i].appendChild(canvas)
	// 						thumbnails.children[i].children[0].parentNode.replaceChild(canvas, thumbnails.children[i].children[0])
	// 						thumbnails.children[i].children[1].children[1].children[0].innerHTML = message.thumbnails[i].size

	// 						if (message.thumbnails[i].group) {
	// 							if (i > 0) {
	// 								if (
	// 									message.thumbnails[i].group !== message.thumbnails[i - 1].group
	// 								) {
	// 									thumbnails.children[i].children[1].children[0].innerHTML = message.thumbnails[i].group
	// 									thumbnails.children[i].classList.add('first')
	// 								}
	// 							} else {
	// 								thumbnails.children[i].children[1].children[0].innerHTML = message.thumbnails[i].group
	// 								thumbnails.children[i].classList.add('first')
	// 							}
	// 						}

	// 						if (message.thumbnails[i].label) {
	// 							thumbnails.children[i].children[1].children[1].children[1].innerHTML = message.thumbnails[i].label
	// 						}
	// 					}
	// 				}
	// 			}


	// 		} else {
	// 			// preview.classList.add('hide')
	// 			// selectIcon.classList.add('show')
	// 		}
	// 	}
	// })


	async function genThumbnailImage(bytes) {
		const canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')
		var imageData = await decodeImage(canvas, ctx, bytes, 84)
		return {
			imageData,
			canvas
		}
	}

	function cloneCanvas(oldCanvas) {

		//create a new canvas
		var newCanvas = document.createElement('canvas');
		var context = newCanvas.getContext('2d');

		//set dimensions
		newCanvas.width = oldCanvas.width;
		newCanvas.height = oldCanvas.height;

		//apply the old canvas to the new one
		context.drawImage(oldCanvas, 0, 0);

		//return the new canvas
		return newCanvas;
	}

	function getCorrectTextColor(hex) {

			/*
			From this W3C document: http://www.webmasterworld.com/r.cgi?f=88&d=9769&url=http://www.w3.org/TR/AERT#color-contrast

			Color brightness is determined by the following formula:
			((Red value X 299) + (Green value X 587) + (Blue value X 114)) / 1000

      I know this could be more compact, but I think this is easier to read/explain.

			*/

			var threshold = 130; /* about half of 256. Lower threshold equals more dark text on dark background  */

			var hRed = hexToR(hex);
			var hGreen = hexToG(hex);
			var hBlue = hexToB(hex);


			function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
			function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
			function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
			function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}

			var cBrightness = ((hRed * 299) + (hGreen * 587) + (hBlue * 114)) / 1000;
			if (cBrightness > threshold){return "#000000";} else { return "#ffffff";}
	}




		// //test colortable
		// var colPairs = new Array("00","22","44","66","99","aa","cc","ff");
		// for(i=0;i<colPairs.length;i++){
		// 	for(j=0;j<colPairs.length;j++){
		// 		for(k=0;k<colPairs.length;k++){
		// 			//build a hexcode
		// 			var theColor = "#"+colPairs[i]+colPairs[j]+colPairs[k];

		// 			//checkf for correct textcolor in passed hexcode
		// 			var textcolor = getCorrectTextColor(theColor);

		// 			//output div
		// 			document.write("<div style='background-color:" + theColor + ";color:"+textcolor+";' class='colorblock'>" + theColor + "</div>");
		// 		}
		// 		document.write("<br/>");
		// 	}
		// }

	function postScrollPos(element) {
		parent.postMessage( { pluginMessage: { type: 'scroll-position', pos: { top: element.scrollTop, left: element.scrollLeft } }}, '*');
	}

	function setScrollPos(element, pos) {
		element.scrollTop = pos.top
		element.scrollLeft = pos.left
	}



	function createSvg(svgString) {
		var container = document.createElement('div');
		container.innerHTML = String.fromCharCode.apply(null, svgString);
		var child = container.children[0]
		// var svg = child.cloneNode(true)
		// container.remove()
		// child.remove()
		return child
	}

	async function onLoad(event) {
		message = await event.data.pluginMessage;

		const thumbnails = root.querySelector('#thumbnails')

		if (thumbnailWrapper && message.scrollPos) {

			setScrollPos(thumbnailWrapper, message.scrollPos)
		}

		setInterval(()=> {
			postScrollPos(thumbnailWrapper)
		}, 300)

		if (message.canvasColor) {
			canvasColor	= message.canvasColor
			oppositeColor =  getCorrectTextColor(message.canvasColor)
			// root.style.backgroundColor = message.canvasColor
		}

			// console.log(message)

			selectedIconThumbnail = message?.selectedIconThumbnail

				if (selectedIconThumbnail) {
					// const ctx2 = canvas2.getContext('2d')
					// await decodeImage(canvas2, ctx2, message.selectedIconThumbnail, 16)
					var svg = createSvg(message.selectedIconThumbnail)
					// svg.style.width = "16px"
					// svg.style.height = "16px"
					preview.classList.add('show')
					svg.style.width = 16
					svg.style.height = 16
					thumbnail.appendChild(svg)
					thumbnail.replaceChild(svg, thumbnail.children[0])
					// thumbnail.children[0].parentNode.replaceChild(svg, thumbnail.children[0])
				}
				else {
					preview.classList.remove('show')
				}
			if (message) {





				if (message.currentIconThumbnail && message.thumbnails) {
					var canvas
					if (message.currentIconThumbnail) {
						canvas = createSvg(message.currentIconThumbnail)
					}

					for (let i = 0; i < message.thumbnails.length; i++) {
						if (thumbnails.children[i]) {

							let clone = canvas.cloneNode(true)

							clone.style.width = message.thumbnails[i].size
							clone.style.height = message.thumbnails[i].size

							thumbnails.children[i].appendChild(clone)
							thumbnails.children[i].children[0].parentNode.replaceChild(clone, thumbnails.children[i].children[0])
							thumbnails.children[i].children[1].children[1].children[0].innerHTML = message.thumbnails[i].size

							if (message.thumbnails[i].group) {
								if (i > 0) {
									if (
										message.thumbnails[i].group !== message.thumbnails[i - 1].group
									) {
										thumbnails.children[i].children[1].children[0].innerHTML = message.thumbnails[i].group
										thumbnails.children[i].classList.add('first')
									}
								} else {
									thumbnails.children[i].children[1].children[0].innerHTML = message.thumbnails[i].group
									thumbnails.children[i].classList.add('first')
								}
							}

							if (message.thumbnails[i].label) {
								thumbnails.children[i].children[1].children[1].children[1].innerHTML = message.thumbnails[i].label
							}
						}
					}
				}



			} else {
				// preview.classList.add('hide')
				// selectIcon.classList.add('show')
			}

	}
</script>

<svelte:window on:message={onLoad}/>

<div class="wrapper" bind:this={root} style="background-color: {canvasColor}">



		<div bind:this={thumbnailWrapper}  class="preview-window">
		<!-- Empty divs to prevent layout changing when loading thumbnails -->
				<div  class="thumbnail-wrapper">
				<div id="thumbnails" style="color: {oppositeColor}">
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
					<div>
						<div></div>
						<div class="icon__info">
							<p class="type--small"></p>
							<div>
								<p class="type--small"></p>
								<p class="type--small"></p>
							</div>
						</div>
					</div>
				</div>
				</div>
		</div>

		<div id="toolbar" bind:this="{toolbar}" class="p-xxsmall flex" style="justify-content: space-between;">
			<button id="refresh" style="background-color: {canvasColor}; color: {oppositeColor}; border-color: {oppositeColor};" bind:this="{preview}" on:click={() => {
						setPreview();
					}} class="previewButton button button--secondary"><div id="thumbnail" bind:this="{thumbnail}"><canvas bind:this="{canvas2}" width="16" height="16"></canvas></div><span style="white-space: nowrap;">Swap</span></button>
		</div>

		<svg id="corner" use:resize width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M13 2L2 13" stroke="black" stroke-opacity="0.24" stroke-linecap="round"/>
		<path d="M13 6.5L6.5 13" stroke="black" stroke-opacity="0.24" stroke-linecap="round"/>
		<path d="M13 11L11 13" stroke="black" stroke-opacity="0.24" stroke-linecap="round"/>
		</svg>
</div>


<!-- <div id="selectIcon" class="selectIcon">
			<div>
				<p>Inspect a frame or group to preview icon</p>
				<button id="inspect" on:click={() => {
							inspectIcon();
						}} class="button button--secondary" style="margin: 0 auto">
					Inspect
				</button>
			</div>
		</div> -->




<style global>

	:global(*) {
		box-sizing: border-box;
	}

	#corner{
		/* display: none; */
		position: absolute;
		right: 0px;
		bottom: 1px;
		cursor: nwse-resize;
		/* background-color: pink; */
	}
	:global(body):hover #corner {
		display: block;
	}

	.show {
		display: block;
	}

	#thumbnail {
		margin-right: 8px;
		/* margin-left: -8px; */
	}

	#thumbnail canvas {
		width: 16px !important;
		height: 16px !important;
	}

	.wrapper {
		display: flex;
		flex-direction: column;
		margin-right: -1px;
		margin-bottom: -1px;
	}

	:global(*) {
		box-sizing: border-box;
	}
	:global(html) {
		height: calc(100% - 1px);
		/* overflow: hidden; */
		position: relative;
	}
	:global(body) {
		padding: 0;
		margin: 0;
		font-family: Inter, sans-serif;
		font-size: 11px;
		color: var(--black);
		/* height: 100%; */
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		overflow: hidden;
		box-shadow: 0 0px 14px rgba(0, 0, 0, 0.15),
			0 0 0 0.5px rgba(0, 0, 0, 0.1);
		border-bottom-left-radius: 2px;
		border-bottom-right-radius: 2px;
	}
	.wrapper {
		/* padding: 16px; */
		height: 100%;
		/* overflow: scroll; */
	}
	.preview-window {
		/* flex-grow: 1; */
		overflow-y: scroll;
		/* scroll-snap-type: y mandatory; */
	}

	.thumbnail-wrapper {
		/* overflow: hidden; */
	}

	#thumbnails {
		display: flex;
    	flex-wrap: wrap;
	}

	#thumbnails > * {
		scroll-snap-align: start;
	}


	/* Vars */
	:root {
		/* COLORS */
		/* Accent */
		--blue: #18a0fb;
		--purple: #7b61ff;
		--hot-pink: #ff00ff;
		--green: #1bc47d;
		--red: #f24822;
		--yellow: #ffeb00;
		/* Basic foreground */
		--black: #000000;
		--black8: rgba(0, 0, 0, 0.8);
		--black8-opaque: #333333;
		--black3: rgba(0, 0, 0, 0.3);
		--black3-opaque: #b3b3b3;
		--white: #ffffff;
		--white8: rgba(255, 255, 255, 0.8);
		--white4: rgba(255, 255, 255, 0.4);
		/* Basic background */
		--grey: #f0f0f0;
		--silver: #e5e5e5;
		--hud: #222222;
		--toolbar: #2c2c2c;
		/* Special */
		--black1: rgba(0, 0, 0, 0.1);
		--blue3: rgba(24, 145, 251, 0.3);
		--purple4: rgba(123, 97, 255, 0.4);
		--hover-fill: rgba(0, 0, 0, 0.06);
		--selection-a: #daebf7;
		--selection-b: #edf5fa;
		--white2: rgba(255, 255, 255, 0.2);
		/* TYPOGRAPHY */
		/* Pos = positive applications (black on white) */
		/* Neg = negative applications (white on black) */
		/* Font stack */
		--font-stack: 'Inter', sans-serif;
		/* Font sizes */
		--font-size-xsmall: 11px;
		--font-size-small: 12px;
		--font-size-large: 13px;
		--font-size-xlarge: 14px;
		/* Font weights */
		--font-weight-normal: 400;
		--font-weight-medium: 500;
		--font-weight-bold: 600;
		/* Lineheight */
		--font-line-height: 16px;
		/* Use For xsmall, small font sizes */
		--font-line-height-large: 24px;
		/* Use For large, xlarge font sizes */
		/* Letterspacing */
		--font-letter-spacing-pos-xsmall: 0.005em;
		--font-letter-spacing-neg-xsmall: 0.01em;
		--font-letter-spacing-pos-small: 0;
		--font-letter-spacing-neg-small: 0.005em;
		--font-letter-spacing-pos-large: -0.0025em;
		--font-letter-spacing-neg-large: 0.0025em;
		--font-letter-spacing-pos-xlarge: -0.001em;
		--font-letter-spacing-neg-xlarge: -0.001em;
		/* BORDER RADIUS */
		--border-radius-small: 2px;
		--border-radius-med: 5px;
		--border-radius-large: 6px;
		/* SHADOWS */
		--shadow-hud: 0 5px 17px rgba(0, 0, 0, 0.2),
			0 2px 7px rgba(0, 0, 0, 0.15);
		--shadow-floating-window: 0 2px 14px rgba(0, 0, 0, 0.15);
		/* SPACING + SIZING */
		--size-xxxsmall: 4px;
		--size-xxsmall: 8px;
		--size-xsmall: 16px;
		--size-small: 24px;
		--size-medium: 32px;
		--size-large: 40px;
		--size-xlarge: 48px;
		--size-xxlarge: 64px;
		--size-xxxlarge: 80px;
	}

	/* Global styles */
	* {
		box-sizing: border-box;
	}

	body {
		position: relative;
		box-sizing: border-box;
		font-family: 'Inter', sans-serif;
		margin: 0;
		padding: 0;
	}

	/*  FONTS */
	@font-face {
		font-family: 'Inter';
		font-weight: 400;
		font-style: normal;
		src: url('https://rsms.me/inter/font-files/Inter-Regular.woff2?v=3.7') format('woff2'),
			url('https://rsms.me/inter/font-files/Inter-Regular.woff?v=3.7') format('woff');
	}

	@font-face {
		font-family: 'Inter';
		font-weight: 500;
		font-style: normal;
		src: url('https://rsms.me/inter/font-files/Inter-Medium.woff2?v=3.7') format('woff2'),
			url('https://rsms.me/inter/font-files/Inter-Medium.woff2?v=3.7') format('woff');
	}

	@font-face {
		font-family: 'Inter';
		font-weight: 600;
		font-style: normal;
		src: url('https://rsms.me/inter/font-files/Inter-SemiBold.woff2?v=3.7') format('woff2'),
			url('https://rsms.me/inter/font-files/Inter-SemiBold.woff2?v=3.7') format('woff');
	}

	/* UTILITIES */
	/* padding */
	.p-xxxsmall {
		padding: var(--size-xxxsmall);
	}

	.p-xxsmall {
		padding: var(--size-xxsmall);
	}

	.p-xsmall {
		padding: var(--size-xsmall);
	}

	.p-small {
		padding: var(--size-small);
	}

	.p-medium {
		padding: var(--size-medium);
	}

	.p-large {
		padding: var(--size-large);
	}

	.p-xlarge {
		padding: var(--size-xlarge);
	}

	.p-xxlarge {
		padding: var(--size-xxlarge);
	}

	.p-huge {
		padding: var(--size-xxxlarge);
	}

	/* padding top */
	.pt-xxxsmall {
		padding-top: var(--size-xxxsmall);
	}

	.pt-xxsmall {
		padding-top: var(--size-xxsmall);
	}

	.pt-xsmall {
		padding-top: var(--size-xsmall);
	}

	.pt-small {
		padding-top: var(--size-small);
	}

	.pt-medium {
		padding-top: var(--size-medium);
	}

	.pt-large {
		padding-top: var(--size-large);
	}

	.pt-xlarge {
		padding-top: var(--size-xlarge);
	}

	.pt-xxlarge {
		padding-top: var(--size-xxlarge);
	}

	.pt-huge {
		padding-top: var(--size-xxxlarge);
	}

	/* padding right */
	.pr-xxxsmall {
		padding-right: var(--size-xxxsmall);
	}

	.pr-xxsmall {
		padding-right: var(--size-xxsmall);
	}

	.pr-xsmall {
		padding-right: var(--size-xsmall);
	}

	.pr-small {
		padding-right: var(--size-small);
	}

	.pr-medium {
		padding-right: var(--size-medium);
	}

	.pr-large {
		padding-right: var(--size-large);
	}

	.pr-xlarge {
		padding-right: var(--size-xlarge);
	}

	.pr-xxlarge {
		padding-right: var(--size-xxlarge);
	}

	.pr-huge {
		padding-right: var(--size-xxxlarge);
	}

	/* padding bottom */
	.pb-xxxsmall {
		padding-bottom: var(--size-xxxsmall);
	}

	.pb-xxsmall {
		padding-bottom: var(--size-xxsmall);
	}

	.pb-xsmall {
		padding-bottom: var(--size-xsmall);
	}

	.pb-small {
		padding-bottom: var(--size-small);
	}

	.pb-medium {
		padding-bottom: var(--size-medium);
	}

	.pb-large {
		padding-bottom: var(--size-large);
	}

	.pb-xlarge {
		padding-bottom: var(--size-xlarge);
	}

	.pb-xxlarge {
		padding-bottom: var(--size-xxlarge);
	}

	.pb-huge {
		padding-bottom: var(--size-xxxlarge);
	}

	/* padding left */
	.pl-xxxsmall {
		padding-left: var(--size-xxxsmall);
	}

	.pl-xxsmall {
		padding-left: var(--size-xxsmall);
	}

	.pl-xsmall {
		padding-left: var(--size-xsmall);
	}

	.pl-small {
		padding-left: var(--size-small);
	}

	.pl-medium {
		padding-left: var(--size-medium);
	}

	.pl-large {
		padding-left: var(--size-large);
	}

	.pl-xlarge {
		padding-left: var(--size-xlarge);
	}

	.pl-xxlarge {
		padding-left: var(--size-xxlarge);
	}

	.pl-huge {
		padding-left: var(--size-xxxlarge);
	}

	/* margin */
	.m-xxxsmall {
		margin: var(--size-xxxsmall);
	}

	.m-xxsmall {
		margin: var(--size-xxsmall);
	}

	.m-xsmall {
		margin: var(--size-xsmall);
	}

	.m-small {
		margin: var(--size-small);
	}

	.m-medium {
		margin: var(--size-medium);
	}

	.m-large {
		margin: var(--size-large);
	}

	.m-xlarge {
		margin: var(--size-xlarge);
	}

	.m-xxlarge {
		margin: var(--size-xxlarge);
	}

	.m-huge {
		margin: var(--size-xxxlarge);
	}

	/* margin top */
	.mt-xxxsmall {
		margin-top: var(--size-xxxsmall);
	}

	.mt-xxsmall {
		margin-top: var(--size-xxsmall);
	}

	.mt-xsmall {
		margin-top: var(--size-xsmall);
	}

	.mt-small {
		margin-top: var(--size-small);
	}

	.mt-medium {
		margin-top: var(--size-medium);
	}

	.mt-large {
		margin-top: var(--size-large);
	}

	.mt-xlarge {
		margin-top: var(--size-xlarge);
	}

	.mt-xxlarge {
		margin-top: var(--size-xxlarge);
	}

	.mt-huge {
		margin-top: var(--size-xxxlarge);
	}

	/* margin right */
	.mr-xxxsmall {
		margin-right: var(--size-xxxsmall);
	}

	.mr-xxsmall {
		margin-right: var(--size-xxsmall);
	}

	.mr-xsmall {
		margin-right: var(--size-xsmall);
	}

	.mr-small {
		margin-right: var(--size-small);
	}

	.mr-medium {
		margin-right: var(--size-medium);
	}

	.mr-large {
		margin-right: var(--size-large);
	}

	.mr-xlarge {
		margin-right: var(--size-xlarge);
	}

	.mr-xxlarge {
		margin-right: var(--size-xxlarge);
	}

	.mr-huge {
		margin-right: var(--size-xxxlarge);
	}

	/* margin bottom */
	.mb-xxxsmall {
		margin-bottom: var(--size-xxxsmall);
	}

	.mb-xxsmall {
		margin-bottom: var(--size-xxsmall);
	}

	.mb-xsmall {
		margin-bottom: var(--size-xsmall);
	}

	.mb-small {
		margin-bottom: var(--size-small);
	}

	.mb-medium {
		margin-bottom: var(--size-medium);
	}

	.mb-large {
		margin-bottom: var(--size-large);
	}

	.mb-xlarge {
		margin-bottom: var(--size-xlarge);
	}

	.mb-xxlarge {
		margin-bottom: var(--size-xxlarge);
	}

	.mb-huge {
		margin-bottom: var(--size-xxxlarge);
	}

	/* margin left */
	.ml-xxxsmall {
		margin-left: var(--size-xxxsmall);
	}

	.ml-xxsmall {
		margin-left: var(--size-xxsmall);
	}

	.ml-xsmall {
		margin-left: var(--size-xsmall);
	}

	.ml-small {
		margin-left: var(--size-small);
	}

	.ml-medium {
		margin-left: var(--size-medium);
	}

	.ml-large {
		margin-left: var(--size-large);
	}

	.ml-xlarge {
		margin-left: var(--size-xlarge);
	}

	.ml-xxlarge {
		margin-left: var(--size-xxlarge);
	}

	.ml-huge {
		margin-left: var(--size-xxxlarge);
	}

	/* layout utilities */
	.hidden {
		display: none;
	}

	.inline {
		display: inline;
	}

	.block {
		display: block;
	}

	.inline-block {
		display: inline-block;
	}

	.flex {
		display: flex;
	}

	.inline-flex {
		display: inline-flex;
	}

	.column {
		flex-direction: column;
	}

	.column-reverse {
		flex-direction: column-reverse;
	}

	.row {
		flex-direction: row;
	}

	.row-reverse {
		flex-direction: row-reverse;
	}

	.flex-wrap {
		flex-wrap: wrap;
	}

	.flex-wrap-reverse {
		flex-wrap: wrap-reverse;
	}

	.flex-no-wrap {
		flex-wrap: nowrap;
	}

	.flex-shrink {
		flex-shrink: 1;
	}

	.flex-no-shrink {
		flex-shrink: 0;
	}

	.flex-grow {
		flex-grow: 1;
	}

	.flex-no-grow {
		flex-grow: 0;
	}

	.justify-content-start {
		justify-content: flex-start;
	}

	.justify-content-end {
		justify-content: flex-end;
	}

	.justify-content-center {
		justify-content: center;
	}

	.justify-content-between {
		justify-content: space-between;
	}

	.justify-content-around {
		justify-content: space-around;
	}

	.align-items-start {
		align-items: flex-start;
	}

	.align-items-end {
		align-items: flex-end;
	}

	.align-items-center {
		align-items: center;
	}

	.align-items-stretch {
		align-items: stretch;
	}

	.align-content-start {
		align-content: flex-start;
	}

	.align-content-end {
		align-content: flex-end;
	}

	.align-content-center {
		align-content: center;
	}

	.align-content-stretch {
		align-content: stretch;
	}

	.align-self-start {
		align-self: flex-start;
	}

	.align-self-end {
		align-items: flex-end;
	}

	.align-self-center {
		align-self: center;
	}

	.align-self-stretch {
		align-self: stretch;
	}

	.button {
		display: flex;
		align-items: center;
		border-radius: var(--border-radius-large);
		color: var(--white);
		flex-shrink: 0;
		font-family: var(--font-stack);
		font-size: var(--font-size-xsmall);
		font-weight: var(--font-weight-medium);
		letter-spacing: var(--font-letter-spacing-neg-small);
		line-height: var(--font-line-height);
		height: var(--size-medium);
		padding: 0 var(--size-xsmall) 0 var(--size-xsmall);
		text-decoration: none;
		outline: none;
		border: 2px solid transparent;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}

	.button--primary {
		background-color: var(--blue);
	}

	.button--primary:enabled:active,
	.button--primary:enabled:focus {
		border: 2px solid var(--black3);
	}

	.button--primary:disabled {
		background-color: var(--black3);
	}

	.button--primary-destructive {
		background-color: var(--red);
	}

	.button--primary-destructive:enabled:active,
	.button--primary-destructive:enabled:focus {
		border: 2px solid var(--black3);
	}

	.button--primary-destructive:disabled {
		opacity: 0.3;
	}

	.button--secondary,
	.button--secondary-destructive {
		background-color: var(--white);
		border: 1px solid var(--black8);
		color: var(--black8);
		padding: 0 calc(var(--size-xsmall) + 1px) 0 calc(var(--size-xsmall) + 1px);
		letter-spacing: var(--font-letter-spacing-pos-small);
	}

	.button--secondary:enabled:active,
	.button--secondary-destructive:enabled:active,
	.button--secondary-destructive:enabled:focus {
		border: 2px solid var(--blue);
		padding: 0 var(--size-xsmall) 0 var(--size-xsmall);
	}

	.button--secondary:disabled,
	.button--secondary-destructive:disabled {
		border: 1px solid var(--black3);
		color: var(--black3);
	}

	.button--secondary-destructive {
		border-color: var(--red);
		color: var(--red);
	}

	.button--secondary-destructive:disabled {
		background-color: var(--white);
	}

	.button--secondary-destructive:enabled:active,
	.button--secondary-destructive:enabled:focus {
		border: 2px solid var(--red);
		padding: 0 var(--size-xsmall) 0 var(--size-xsmall);
	}

	.button--secondary-destructive:disabled {
		border: 1px solid var(--red);
		background-color: var(--white);
		color: var(--red);
		opacity: 0.4;
	}

	.button--tertiary,
	.button--tertiary-destructive {
		border: 1px solid transparent;
		color: var(--blue);
		padding: 0;
		font-weight: var(--font-weight-normal);
		letter-spacing: var(--font-letter-spacing-pos-small);
		cursor: pointer;
	}

	.button--tertiary:enabled:focus,
	.button--tertiary-destructive:enabled:focus {
		text-decoration: underline;
	}

	.button--tertiary:disabled,
	.button--tertiary-destructive:disabled {
		cursor: default;
		color: var(--black3);
	}

	.button--tertiary-destructive {
		color: var(--red);
	}

	.button--tertiary-destructive:enabled:focus {
		text-decoration: underline;
	}

	.button--tertiary-destructive:disabled {
		opacity: 0.4;
	}


	.type {
		font-family: var(--font-stack);
		font-size: var(--font-size-xsmall);
		font-weight: var(--font-weight-normal);
		line-height: var(--font-line-height);
		letter-spacing: var(--font-letter-spacing-pos-xsmall);
		/* sizes */
		/* weights */
		/* letter spacing adjustments based pos/neg application */
	}

	.type--small {
		font-size: var(--font-size-small);
		letter-spacing: var(--font-letter-spacing-pos-small);
	}

	.type--large {
		font-size: var(--font-size-large);
		line-height: var(--font-line-height-large);
		letter-spacing: var(--font-letter-spacing-pos-large);
	}

	.type--xlarge {
		font-size: var(--font-size-xlarge);
		line-height: var(--font-line-height-large);
		letter-spacing: var(--font-letter-spacing-pos-xlarge);
	}

	.type--medium {
		font-weight: var(--font-weight-medium);
	}

	.type--bold {
		font-weight: var(--font-weight-bold);
	}

	.type--inverse {
		letter-spacing: var(--font-letter-spacing-neg-xsmall);
	}

	.type--inverse+.type--small {
		letter-spacing: var(--font-letter-spacing-neg-small);
	}

	.type--inverse+.type--large {
		letter-spacing: var(--font-letter-spacing-neg-large);
	}

	.type--inverse+.type--xlarge {
		letter-spacing: var(--font-letter-spacing-neg-xlarge);
	}

	.type--inline {
		display: inline-block;
	}

	.wrapper {
		/* overflow: hidden; */
	}



	/* CUSTOM CSS */

	:root {
		--icon-width: 176px;
	}

	html {
		position: relative;
		/* overflow-y: scroll; */
	}

	#thumbnails {
		/* margin-bottom: -1px; */
		/* margin-right: -1px; */
		/* overflow-y: scroll; */
		/* overflow-x: hidden; */
		display: flex;
	}

	#thumbnails>* {
		border-bottom: 1px solid rgba(194, 194, 194, 0.3);
		border-right: 1px solid rgba(194, 194, 194, 0.3);
		box-sizing: border-box;
		flex-grow: 0;
		height: var(--icon-width);
		display: grid;
		place-items: center;
		position: relative;
		float: left;
		width: 100%;
	}

	.preview-window {
			scroll-snap-type: y mandatory;
		}

	@media (max-width: 319px) {

	}

	@media (min-width: 320px) {

		#thumbnails>* {
			width: calc(100% / 2);
		}

	}

	@media (min-width: 520px) {
		#thumbnails>* {
			width: calc(100% / 3);
		}

	}

	@media (min-width: 740px) {
		#thumbnails>* {
			width: calc(100% / 4);
		}

	}

	@media (min-width: 920px) {
		#thumbnails>* {
			width: calc(100% / 5);
		}

	}

	@media (min-width: 1220px) {
		#thumbnails>* {
			width: calc(100% / 6);
		}

	}

	@media (min-width: 1580px) {
		#thumbnails>* {
			width: calc(100% / 7);
		}

	}



	#toolbar {
		/* display: none; */
		position: fixed;
		bottom: 0;
		width: 100%;
		min-height: 49px;
		user-select: none;
		pointer-events: none;
		/* border-top: 1px solid #e5e5e5; */
		/* background-color: white; */
	}

	#inspect:enabled:active,
	#inspect:enabled:focus {
		border: 2px solid var(--blue);
	}

	.icon__info {
		position: absolute;
		top: 12px;
		left: 12px;
		bottom: 12px;
		right: 12px;
	}

	.icon__info> :nth-child(1) {
		position: absolute;
		top: 0;
		/* color: var(--black); */
	}

	.icon__info> :nth-child(2) {
		position: absolute;
		bottom: 0;
		width: 100%;
	}

	.icon__info>*> :nth-child(1) {
		text-align: right;
		/* margin-right: -4px; */
		opacity: 0.3;
	}

	.icon__info>*> :nth-child(2) {
		position: absolute;
		left: 0;
		top: 0;
		opacity: 0.3;
		/* margin-left: -4px; */
	}

	.icon__info p {
		margin-bottom: 0;
		margin-top: 0;
	}

	.black3 {
		color: var(--black3);
	}

	.selectIcon {
		height: calc(100% - 48px);
		display: none;
		place-items: center;
	}

	.previewButton {
		padding: 8px;
		width: 88px;
		margin-left: auto;
		display: none;
		justify-content: center;
		pointer-events: auto;
	}

	.show {
		display: flex;
	}
</style>
