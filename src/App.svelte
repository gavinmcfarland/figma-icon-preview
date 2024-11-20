<script lang="ts">
	// FIXME: I think, when buffer sent via websockets is lost when recieved
	import { onMount } from 'svelte'
	import './reset.css'

	export const name: string = ''
	let root
	let toolbar
	let actionbar
	let message
	let canvas2
	let thumbnail
	let preview
	let canvasColor = 'transparent'
	let oppositeColor
	let selectedIconThumbnail
	let thumbnailWrapper
	let previewLocked = false
	let lockButton

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

		var thumbnailSettings2 = [
	{
		name: "General",
		icons: [
		{ size: 16, group: "General" },
		{ size: 24, group: "General" },
		{ size: 32, group: "General" },
		{ size: 48, group: "General" },
		{ size: 64, group: "General" },
		{ size: 96, group: "General" },
		{ size: 128, group: "General" }
		]
	},
	{
		name: "iOS",
		icons: [
		{ size: 20, group: "iOS", label: "Notification" },
		{ size: 29, group: "iOS", label: "Settings" },
		{ size: 40, group: "iOS", label: "Spotlight" },
		{ size: 60, group: "iOS", label: "iPhone" },
		{ size: 76, group: "iOS", label: "iPad" },
		{ size: 83.5, group: "iOS", label: "iPad Pro" }
		]
	},
	{
		name: "Android",
		icons: [
		{ size: 16, group: "Android", label: "Small Contextual" },
		{ size: 22, group: "Android", label: "Notification" },
		{ size: 24, group: "Android", label: "System" },
		{ size: 48, group: "Android", label: "Product" }
		]
	}
	]

	function resize(node, event) {
		function resizeWindow(event) {
			const size = {
				width: Math.max(50, Math.floor(event.clientX + 5)),
				height: Math.max(50, Math.floor(event.clientY + 5)),
			}
			parent.postMessage(
				{ pluginMessage: { type: 'resize', size: size } },
				'*',
			)
		}
		node.onpointerdown = (e) => {
			corner.onpointermove = resizeWindow
			corner.setPointerCapture(e.pointerId)
		}
		node.onpointerup = (e) => {
			corner.onpointermove = null
			corner.releasePointerCapture(e.pointerId)
		}

		// corner.onpointerdown = (e)=>{
		// 	corner.onpointermove = resizeWindow;
		// 	corner.setPointerCapture(e.pointerId);
		// };
		// corner.onpointerup = (e)=>{
		// 	corner.onpointermove = null;
		// 	corner.releasePointerCapture(e.pointerId);
		// };
	}

	function lockPreview() {
		selectedIconThumbnail = undefined

		if (previewLocked) {
			previewLocked = false
		} else {
			previewLocked = true
		}

		parent.postMessage(
			{ pluginMessage: { type: 'lock-preview', locked: previewLocked } },
			'*',
		)
	}

	function getCorrectTextColor(hex) {
		/*
			From this W3C document: http://www.webmasterworld.com/r.cgi?f=88&d=9769&url=http://www.w3.org/TR/AERT#color-contrast

			Color brightness is determined by the following formula:
			((Red value X 299) + (Green value X 587) + (Blue value X 114)) / 1000

      I know this could be more compact, but I think this is easier to read/explain.

			*/

		var threshold = 160 /* about half of 256. Lower threshold equals more dark text on dark background  */

		var hRed = hexToR(hex)
		var hGreen = hexToG(hex)
		var hBlue = hexToB(hex)

		function hexToR(h) {
			return parseInt(cutHex(h).substring(0, 2), 16)
		}
		function hexToG(h) {
			return parseInt(cutHex(h).substring(2, 4), 16)
		}
		function hexToB(h) {
			return parseInt(cutHex(h).substring(4, 6), 16)
		}
		function cutHex(h) {
			return h.charAt(0) == '#' ? h.substring(1, 7) : h
		}

		var cBrightness = (hRed * 299 + hGreen * 587 + hBlue * 114) / 1000
		if (cBrightness > threshold) {
			return '#000000'
		} else {
			return '#ffffff'
		}
	}

	function postScrollPos(element) {
		if (element) {
			var scrollPos = { top: element.scrollTop, left: element.scrollLeft }
			parent.postMessage(
				{ pluginMessage: { type: 'scroll-position', pos: scrollPos } },
				'*',
			)
		}
	}

	function setScrollPos(element, pos) {

		element.scrollTop = pos.top
		element.scrollLeft = pos.left
	}

	function hexToRgba(hex, opacity?) {
		if (hex) {
			var c
			if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
				c = hex.substring(1).split('')
				if (c.length == 3) {
					c = [c[0], c[0], c[1], c[1], c[2], c[2]]
				}
				c = '0x' + c.join('')
				return (
					'rgba(' +
					[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') +
					',' +
					opacity +
					')'
				)
			}
			throw new Error('Bad Hex')
		}
	}

	function createSvg(uint8Array) {
		// Decode the Uint8Array into a string
		const svgString = new TextDecoder().decode(uint8Array)

		// Parse the string into an SVG DOM element
		const parser = new DOMParser()
		const svgDoc = parser.parseFromString(svgString, 'image/svg+xml')

		// Return the root SVG element
		return svgDoc.documentElement
	}

	$: {
		document.body.style.backgroundColor = canvasColor
	}

	onMount(() => {
		if (thumbnailWrapper) {
			setInterval(() => {
				postScrollPos(thumbnailWrapper)
			}, 300)
		}

		parent.postMessage({
			pluginMessage: {
				type: "UI_LOADED"
			}
		}, "*")

		window.onmessage = async (event) => {
			message = await event.data.pluginMessage

			if (message.type === 'POST_SAVED_SCROLL_POS') {

				// Using timeout to avoid issue when toolbar present in dev mode
				let scrollPos = message.pos
				setTimeout(() => {
					setScrollPos(thumbnailWrapper, scrollPos)
				}, 10)

			}

			if (message.type === 'GET_ICON') {

				if (message.canvasColor) {
					canvasColor = message.canvasColor
					oppositeColor = getCorrectTextColor(message.canvasColor)
					// root.style.backgroundColor = message.canvasColor
				}

				if (!message || !message.currentIconThumbnail) return;

				const canvas = createSvg(message.currentIconThumbnail);
				const svgContainers = document.querySelectorAll('.svg');

				thumbnailSettings.forEach(({ size }, index) => {
					const svgContainer = svgContainers[index];
					if (!svgContainer) return;

					if (message.currentIconThumbnail && canvas) {
						const clone = canvas.cloneNode(true);
						clone.style.width = size;
						clone.style.height = size;

						svgContainer.innerHTML = ''; // Clear existing content
						svgContainer.appendChild(clone);
					} else {
						svgContainer.innerHTML = ''; // Ensure it's empty if no icon
					}
				});
			}
		}
	})
</script>

<div class="wrapper" bind:this={root}>
	<div
		id="actionbar"
		bind:this={actionbar}
		class="p-xxsmall flex"
		style="justify-content: space-between;">
		<button
			id="lock"
			style="color: {oppositeColor}; --hover-color: {hexToRgba(
				oppositeColor,
				0.06,
			)};"
			bind:this={lockButton}
			on:click={() => {
				lockPreview()
			}}
			class="lockButton button button--tertiary"
			><span style="white-space: nowrap;">
				{#if previewLocked}<svg
						width="8"
						height="10"
						viewBox="0 0 8 10"
						fill="none"
						xmlns="http://www.w3.org/2000/svg">
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M5.5 2.5V4H2.5V2.5C2.5 1.67157 3.17157 1 4 1C4.82843 1 5.5 1.67157 5.5 2.5ZM1.5 4V2.5C1.5 1.11929 2.61929 0 4 0C5.38071 0 6.5 1.11929 6.5 2.5V4H7C7.27614 4 7.5 4.22386 7.5 4.5V9.5C7.5 9.77614 7.27614 10 7 10H1C0.723858 10 0.5 9.77614 0.5 9.5V4.5C0.5 4.22386 0.723858 4 1 4H1.5Z"
							fill={oppositeColor}
							fill-opacity="0.8" />
					</svg>
				{:else}
					<svg
						width="10"
						height="11"
						viewBox="0 0 10 11"
						fill="none"
						xmlns="http://www.w3.org/2000/svg">
						<path
							fill-rule="evenodd"
							clip-rule="evenodd"
							d="M6 4V5H6.5C6.77614 5 7 5.22386 7 5.5V10.5C7 10.7761 6.77614 11 6.5 11H0.5C0.223858 11 0 10.7761 0 10.5V5.5C0 5.22386 0.223858 5 0.5 5H5V2.5C5 1.11929 6.11929 0 7.5 0C8.88071 0 10 1.11929 10 2.5V4H9V2.5C9 1.67157 8.32843 1 7.5 1C6.67157 1 6 1.67157 6 2.5V4Z"
							fill={oppositeColor}
							fill-opacity="0.8" />
					</svg>
				{/if}
			</span></button>
	</div>

	<div bind:this={thumbnailWrapper} class="preview-window">
		<!-- Empty divs to prevent layout changing when loading thumbnails -->
		<div class="thumbnail-wrapper">
			<div
				id="thumbnails"
				style="color: {oppositeColor}; --border-color: {hexToRgba(
					oppositeColor,
					0.07,
				)}; --group-color: {hexToRgba(oppositeColor, 0.8)}">
				{#each thumbnailSettings2 as { name, icons }}
				<div class="icon__group">
				  <p class="group-name">{name}</p>
				  <div class="icons">
				  {#each icons as { size, group, label }}
					<div class="icon">
						<div class="icon-container">
					  <div class="svg"></div>
					</div>
					  <div class="icon__info">
						<div>
						  <p class="icon__label__size">{size}px</p>
						  <p class="icon__label__label">{label || ''}</p>
						</div>
					  </div>
					</div>
				  {/each}
					</div>
				</div>
			  {/each}
			</div>
		</div>
	</div>

	<svg
		id="corner"
		use:resize
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg">
		<path
			d="M13 2L2 13"
			stroke={oppositeColor}
			stroke-opacity="0.24"
			stroke-linecap="round" />
		<path
			d="M13 6.5L6.5 13"
			stroke={oppositeColor}
			stroke-opacity="0.24"
			stroke-linecap="round" />
		<path
			d="M13 11L11 13"
			stroke={oppositeColor}
			stroke-opacity="0.24"
			stroke-linecap="round" />
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

	html {
		position: relative;
		--border-color: var(--figma-color-border);
		/* overflow-y: scroll; */
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


	#actionbar {
		position: fixed;
		top: 12px;
		right: 12px;
	}
	#corner {
		/* display: none; */
		position: fixed;
		right: 0px;
		bottom: 1px;
		cursor: nwse-resize;
		/* background-color: pink; */
	}



	/* layout utilities */
	.hidden {
		display: none;
	}

	.group-name {
		padding: 12px;
		margin: 0;
		position: sticky;
		top: 0;
	}

	.icon__group {

	}

	.icons {
		border-top: 1px solid var(--border-color);
	}

	.icons {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		justify-content: center;
		align-items: stretch; /* Ensures all items are the same height */
	}

	.icons > * {
		border-bottom: 1px solid var(--border-color);
		border-right: 1px solid var(--border-color);
		min-height: calc(((100vh - 37px) / 3));
	}

	.icon {
		padding: 12px;
		display: flex;
		flex-direction: column;
		display: flex;
	}

	.icon__label__size {

	}

	.svg {
		align-self: center;
	}

	.icon-container {
		flex-grow: 1;
		align-content: center;
		align-self: center;
	}

	.icon__info {
		position: relative;
	}

	.icon__info > :nth-child(1) {
		top: 12px;
		/* color: var(--black); */
		color: var(--group-color);
	}

	.icon__info > :nth-child(2) {
		position: absolute;
		bottom: 0;
		width: 100%;
	}

	.icon__info > * > :nth-child(1) {
		text-align: right;
		/* margin-right: -4px; */
		opacity: 0.5;
	}

	.icon__info > * > :nth-child(2) {
		position: absolute;
		left: 0;
		top: 0;
		opacity: 0.5;
		/* margin-left: -4px; */
	}

	.icon__info p {
		margin-bottom: 0;
		margin-top: 0;
	}


	.show {
		display: flex;
	}
</style>
