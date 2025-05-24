import fs from 'fs';
import path from 'path';

const iconsDir = path.join(__dirname, '../src/assets/icon-data');
const outputFile = path.join(__dirname, '../src/assets/icon-data/icons.json');
const iconData: Record<string, IconData> = {};

interface BaseIconData {
    name: string;
    svg: string;
    lucide: string;
}

interface IconData extends BaseIconData {
    firstVersion: string;
    lastVersion: string;
}

let included_versions: string[] = [];
for (const file of fs.readdirSync(iconsDir)) {
    if (file === 'icons.json' || !file.endsWith('.json')) {
        continue;
    }

    const version = file.slice(0, -5); // Extract version from filename
    const fileContents = fs.readFileSync(path.join(iconsDir, file), 'utf-8');
    const icons = JSON.parse(fileContents) as Record<string, BaseIconData>;

    for (const [key, icon] of Object.entries(icons)) {
        if (!iconData[key]) {
            iconData[key] = {
                ...icon,
                firstVersion: version,
                lastVersion: version,
            };
        } else {
            iconData[key].lastVersion = version;
        }
    }

    included_versions.push(version);
}

for (const key in iconData) {
    if (included_versions[included_versions.length - 1] === iconData[key].lastVersion) {
        delete (iconData[key] as Partial<IconData>).lastVersion;
    }
}

const output = {
    icons: iconData,
    versions: included_versions,
}
fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
