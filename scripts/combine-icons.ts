import fs from 'fs';
import path from 'path';

const ICONS_DIR = path.join(__dirname, '../icon-data');
const OUTPUT_FILE = path.join(__dirname, '../icon-data/icons.json');

interface BaseIconData {
    name: string;
    svg: string;
    lucide: string;
}

interface IconData extends BaseIconData {
    firstVersion: string;
    lastVersion: string;
    deprecated: boolean;
    is_new: boolean;
    tags: string[];
    categories: string[];
    alternatives?: string[];
}

interface LucideIconData {
    $schema: string;
    contributors: string[];
    categories: string[];
    tags: string[];
    aliases?: string[];
}


let included_versions: string[] = [];
let included_tags: Set<string> = new Set();
let included_categories: Set<string> = new Set();


// All icons from this version onwards are marked 'NEW'
const NEW_VERSION = "1.7.7";
const LUCIDE_ICONS_DATA = JSON.parse(fs.readFileSync(path.join(ICONS_DIR, 'lucide-icons.json'), 'utf-8')) as Record<string, LucideIconData>;
const ICON_ALTERNATIVES = JSON.parse(fs.readFileSync(path.join(ICONS_DIR, 'alternatives.json'), 'utf-8')) as Record<string, string[]>;
const LUCIDE_ALIASES = Object.entries(LUCIDE_ICONS_DATA).reduce((acc: Record<string, LucideIconData>, [key, icon]) => {
    if (icon.aliases) {
        icon.aliases.forEach(alias => {
            acc[alias] = icon;
        });
    }
    return acc;
}, {});

function semverCompare(a: string, b: string): boolean {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }) >= 0;
}


const iconData: Record<string, IconData> = {};
for (const file of fs.readdirSync(ICONS_DIR)) {
    if (!/^\d+\.\d+\.\d+\.json$/.test(file)) {
        continue;
    }

    const version = file.slice(0, -5); // Extract version from filename
    const fileContents = fs.readFileSync(path.join(ICONS_DIR, file), 'utf-8');
    const icons = JSON.parse(fileContents) as Record<string, BaseIconData>;

    for (const [key, icon] of Object.entries(icons)) {
        if (!iconData[key]) {
            const strippedPrefix = key.startsWith('lucide-') ? key.slice(7) : key;

            let { tags, categories } = LUCIDE_ICONS_DATA[strippedPrefix]  || LUCIDE_ALIASES[strippedPrefix] || {};
            if (tags) {
                tags.forEach(tag => included_tags.add(tag));
            } else {
                tags = [];
            }
            if (categories) {
                categories.forEach(category => included_categories.add(category));
            } else {
                categories = [];
            }

            iconData[key] = {
                ...icon,
                firstVersion: version,
                lastVersion: version,
                alternatives: ICON_ALTERNATIVES[key],
                deprecated: false,
                is_new: semverCompare(version, NEW_VERSION),
                tags,
                categories,
            };
        } else {
            iconData[key].lastVersion = version;
        }
    }

    included_versions.push(version);
}

const SVG_ALTERNATIVES_SET = new Map<string, string[]>();
for (const [key, icon] of Object.entries(iconData)) {
    const innerContents = icon.svg.replace(/<svg[^>]*>|<\/svg>/g, '').trim();
    SVG_ALTERNATIVES_SET.set(innerContents, (SVG_ALTERNATIVES_SET.get(innerContents) || []).concat(key));
}

const SVG_ALTERNATIVES: Record<string, string[]> = {};
for (const alternatives of SVG_ALTERNATIVES_SET.values()) {
    for (const icon of alternatives) {
        SVG_ALTERNATIVES[icon] = alternatives.filter(a => a !== icon);
    }
}

const outputIcons: IconData[] = Object.entries(iconData)
    .map(([key, icon]) => {
        const alternatives = Array.from(new Set([
            ...(icon.alternatives || []),
            ...(SVG_ALTERNATIVES[key] || []),
        ]));
        return {
            id: key,
            ...icon,
            alternatives: alternatives.length > 0 ? alternatives.sort() : undefined,
            tags: icon.tags.sort(),
                categories: icon.categories.sort(),
            deprecated: icon.lastVersion !== included_versions[included_versions.length - 1],
        }
    })
    .sort((a, b) => a.name.localeCompare(b.name));

const output = {
    icons: outputIcons,
    versions: included_versions,
    tags: Array.from(included_tags).sort(),
    categories: Array.from(included_categories).sort(),
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
