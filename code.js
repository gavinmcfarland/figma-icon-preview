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
const exportSettings = {
    format: "PNG",
    constraint: {
        type: "SCALE",
        value: 8
    }
};
var targetID;
function getImage(refresh) {
    return __awaiter(this, void 0, void 0, function* () {
        var target;
        if (refresh) {
            target = figma.currentPage.findOne(n => n.id === targetID);
        }
        else {
            target = figma.currentPage.selection[0];
        }
        if (target) {
            if (target.type === "FRAME" || target.type === "GROUP" || target.type === "COMPONENT" || target.type === "INSTANCE") {
                if (!refresh) {
                    targetID = clone(figma.currentPage.selection[0]).id;
                }
                var imageBytes = yield target.exportAsync(exportSettings);
                figma.ui.postMessage(imageBytes);
            }
        }
    });
}
figma.showUI(__html__);
getImage();
figma.on("selectionchange", () => {
    getImage();
});
figma.ui.onmessage = msg => {
    if (msg.type === 'refresh') {
        getImage(true);
    }
};
