// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
// This shows the HTML page in "ui.html".
function clone(val) {
    return JSON.parse(JSON.stringify(val));
}
function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate)
                func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow)
            func.apply(context, args);
    };
}
;
const exportSettings = {
    format: "PNG",
    constraint: {
        type: "SCALE",
        value: 8
    }
};
var lastSelectedNode;
var imageBytes;
function getImage(refresh) {
    return __awaiter(this, void 0, void 0, function* () {
        var target;
        if (refresh) {
            target = lastSelectedNode;
        }
        else {
            target = figma.currentPage.selection[0];
        }
        if (target) {
            if (target.type === "FRAME" || target.type === "GROUP" || target.type === "COMPONENT" || target.type === "INSTANCE") {
                if (!refresh) {
                    lastSelectedNode = figma.currentPage.selection[0];
                }
                figma.ui.postMessage(yield target.exportAsync(exportSettings));
            }
        }
    });
}
figma.showUI(__html__);
setInterval(() => {
    getImage(true);
}, 250);
getImage();
figma.on("selectionchange", () => {
    getImage();
});
figma.ui.onmessage = msg => {
    if (msg.type === 'refresh') {
        getImage(true);
    }
    if (msg.type === 'select') {
        getImage();
    }
};
