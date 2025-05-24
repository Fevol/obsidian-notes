import { spawn } from "node:child_process";

let cmd = '';
let attrs = {};
if (process.platform === 'linux') {
    cmd = 'xdg-open';
    attrs = { stdio: 'ignore' };
} else if (process.platform === 'darwin') {
    cmd = 'open';
} else if (process.platform === 'win32') {
    cmd = 'start';
    attrs = { shell: true };
} else {
    console.error('Unsupported OS:', process.platform);
    process.exit(1);
}

spawn(cmd, ['obsidian://open?vault=vault'], attrs)
    .on('error', (err) => {
        console.error('Error opening Obsidian:', err);
        process.exit(1);
    });
setTimeout(() => {
    spawn(cmd, ['obsidian://list-icons'], attrs)
        .on('error', (err) => {
            console.error('Error opening icon list:', err);
            process.exit(1);
        });
}, 250);
