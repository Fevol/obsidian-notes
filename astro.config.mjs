import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightObsidian, { obsidianSidebarGroup } from 'starlight-obsidian';
import starlightObsidianTheme from 'starlight-theme-obsidian';
import starlightLinksValidator from 'starlight-links-validator';

import svelte from '@astrojs/svelte';

export default defineConfig({
    site: "https://fevol.github.io",
    base: "/obsidian-notes",
    integrations: [
        starlight({
            title: "Fevol's Compendium",
            credits: true,
            social: [
                { icon: 'github', label: 'GitHub', href: 'https://github.com/fevol/obsidian-notes'},
                { icon: 'discord', label: 'Discord', href: 'https://discord.com/users/264169866511122432' },
            ],
            editLink: {
                baseUrl: 'https://github.com/fevol/obsidian-notes/edit/main/docs/',
            },
            customCss: [
                './src/styles/global.css',
            ],
            plugins: [
                starlightLinksValidator({
                    errorOnInvalidHashes: false
                }),
                starlightObsidian({
                    vault: './vault'
                }),
                starlightObsidianTheme(),
            ],
            favicon: './favicon.svg',
            sidebar: [
                {
                    label: 'Start Here',
                    items: [
                        { label: 'Overview', link: '/overview/' },
                    ],
                },
                {
                    label: 'Utilities',
                    autogenerate: {
                        directory: 'utils'
                    },
                },
                obsidianSidebarGroup
            ],
            components: {
                Head: './src/overrides/Head.astro',
            },
        }),
        svelte({
            extensions: ['.svelte']
        })
    ],
    devToolbar: { enabled: false },
});
