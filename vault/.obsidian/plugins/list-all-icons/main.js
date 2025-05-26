var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
    for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
                __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);


var plugin_exports = {};
__export(plugin_exports, {
    default: () => IconLister
});
module.exports = __toCommonJS(plugin_exports);

var import_obsidian = require("obsidian");
const path = require("path");
const fs = require("fs");

function toTitleCase(str) {
    return str
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

var IconLister = class extends import_obsidian.Plugin {
    constructor() {
        super(...arguments);
    }

    saveIconsToFile() {
        const icons = import_obsidian.getIconIds()
        const icons_list = Object.fromEntries(icons.map((icon) => {
            let stripped_icon = icon.replace("lucide-", "");
            return [icon, {
                name: toTitleCase(stripped_icon),
                svg: import_obsidian.getIcon(icon).outerHTML,
                lucide: icon.startsWith("lucide-"),
            }]
        }));
        const version = import_obsidian.apiVersion;
        const fs = require('fs');
        const path = require('path');
        console.log(this.app.vault.adapter.basePath)
        const filePath = path.join(this.app.vault.adapter.basePath, '../icon-data/', `${version}.json`);
        console.log(filePath)
        fs.writeFile(filePath, JSON.stringify(icons_list, null, 2), (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(`Icons data written to ${filePath}`);
        });
    }

    async onload() {
        this.registerObsidianProtocolHandler("list-icons", async (e) => {
            this.saveIconsToFile()
        });

        this.addCommand({
            id: "generate-icons-file",
            name: "Fetch all icons and generate a file",
            callback: () => {
                this.saveIconsToFile();
            }
        });
    }
};
