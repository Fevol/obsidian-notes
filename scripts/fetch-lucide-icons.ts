// I did not bother to write this code myself


import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as yauzl from 'yauzl';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

const LUCIDE_API_URL = 'https://api.github.com/repos/lucide-icons/lucide/releases/latest';
const OUTPUT_DIR = path.resolve(__dirname, '../icon-data');
const USER_AGENT = 'node.js';

async function getLatestRelease() {
    const res = await fetch(LUCIDE_API_URL, {
        headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);

    const data = await res.json();
    const asset = data.assets.find((a: any) => a.name.startsWith('lucide-icons-') && a.name.endsWith('.zip'));
    if (!asset) throw new Error('No matching asset found');

    return {
        name: asset.name,
        url: asset.browser_download_url
    };
}

async function downloadZip(url: string, outputPath: string) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) throw new Error(`Failed to download zip: ${response.statusText}`);
    await streamPipeline(response.body, fs.createWriteStream(outputPath));
}

function extractJsonFilesFromZip(zipPath: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
        yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
            if (err || !zipfile) return reject(err || new Error('Zipfile is null'));

            const result: Record<string, any> = {};

            zipfile.readEntry();

            zipfile.on('entry', (entry) => {
                if (/\/$/.test(entry.fileName) || !entry.fileName.endsWith('.json')) {
                    zipfile.readEntry();
                    return;
                }

                zipfile.openReadStream(entry, (err, readStream) => {
                    if (err || !readStream) return reject(err || new Error('Stream not found'));

                    let chunks: Buffer[] = [];
                    readStream.on('data', (chunk) => chunks.push(chunk));
                    readStream.on('end', () => {
                        try {
                            const content = Buffer.concat(chunks as unknown as any).toString('utf8');
                            const json = JSON.parse(content);
                            const key = path.basename(entry.fileName, '.json');
                            result[key] = json;
                            zipfile.readEntry();
                        } catch (parseError) {
                            reject(parseError);
                        }
                    });
                });
            });

            zipfile.on('end', () => resolve(result));
            zipfile.on('error', reject);
        });
    });
}

async function main() {
    try {
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        const { name, url } = await getLatestRelease();
        const zipPath = path.join(OUTPUT_DIR, name);

        console.log(`Downloading ${name}...`);
        await downloadZip(url, zipPath);

        console.log(`Extracting JSON files from ${name}...`);
        const icon_data  = await extractJsonFilesFromZip(zipPath);

        const outputFilePath = path.join(OUTPUT_DIR, 'lucide-icons.json');
        fs.writeFileSync(outputFilePath, JSON.stringify(icon_data, null, 2), 'utf-8');
        console.log(`JSON files extracted to ${outputFilePath}`);

        console.log(`Deleting ${name}...`);
        fs.unlinkSync(zipPath);

        console.log('Finished downloading and extracting Lucide icons.');
    } catch (err) {
        console.error('Error:', err);
    }
}

main();
