<!--
    This page has been inspired by the Typst sym and emoji reference page, found at https://typst.app/docs/reference/symbols/emoji
    Since this is meant to be a small side-project, the code quality is not the best, so please be kind.
-->
<script lang="ts">
    import Icons from '../../icon-data/icons.json?raw'
    import {onMount} from "svelte";
    import { clickoutside } from '@svelte-put/clickoutside';
    import Fuse from 'fuse.js';

    interface Icon {
        id: string;
        name: string;
        svg: string;
        lucide: boolean;
        deprecated: boolean;
        is_new: boolean;
        firstVersion: string;
        lastVersion: string;
        alternatives?: string[];
        categories: string[];
        tags: string[];
    }

    type IconList = Icon[];

    const iconsInformation = JSON.parse(Icons) as {
        icons: IconList;
        versions: string[];
        tags: string[];
        categories: string[];
    };
    const { icons, versions } = iconsInformation;

    const copyIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
    `
    const downloadIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
    `;
    const checkIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    `;


    let inputtedText: string = $state('');
    let showLucidePrefix: boolean = $state(true);
    let showLucideIcons: boolean = $state(true);
    let clickedIcon: Icon | null = $state(null);
    let mouseEvent: MouseEvent | null = $state(null);
    let minimumVersion: number = $state(versions.findIndex(v => v === '1.8.10'));
    let iconListContentRect = $state({ left: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, x: 0, y: 0 }) as DOMRect;
    let iconInfoContentRect = $state({ left: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, x: 0, y: 0 }) as DOMRect;
    let searchIdentifiers: boolean = $state(true);
    let searchTags: boolean = $state(false);
    let searchCategories: boolean = $state(false);

    let downloadSuccess: boolean = $state(false);
    let copySvgSuccess: boolean = $state(false);
    let copyIdSuccess: boolean = $state(false);

    let filteredList = $derived.by(() => filterIcons(icons, inputtedText, showLucideIcons, versions[minimumVersion]));

    let fuse = $derived.by(() => {
        const keys: string[] = [];
        if (searchIdentifiers) keys.push('id');
        if (searchTags) keys.push('tags');
        if (searchCategories) keys.push('categories');

        return new Fuse(icons, {
            keys,
            threshold: 0.22,
        });
    });


    onMount(() => {
        const url = new URL(window.location.href);
        inputtedText = url.searchParams.get('q') || '';
        searchIdentifiers = url.searchParams.has('id') ? url.searchParams.get('id') === 't' : searchIdentifiers;
        searchTags = url.searchParams.has('tag') ? url.searchParams.get('tag') === 't' : searchTags;
        searchCategories = url.searchParams.has('cat') ? url.searchParams.get('cat') === 't' : searchCategories;
        showLucideIcons = url.searchParams.has('lucide') ? url.searchParams.get('lucide') === 't' : showLucideIcons;
        showLucidePrefix = url.searchParams.has('prefix') ? url.searchParams.get('prefix') === 't' : showLucidePrefix;
        minimumVersion = url.searchParams.has('min_version') ? versions.findIndex(v => v === url.searchParams.get('min_version')) : minimumVersion;
    });

    function copyShareLink() {
        const url = new URL(window.location.href);
        const check: [string, string | boolean][] = [
            ['q', inputtedText],
            ['id', searchIdentifiers],
            ['tag', searchTags],
            ['cat', searchCategories],
            ['lucide', showLucideIcons],
            ['prefix', showLucidePrefix],
        ]

        for (const [key, value] of check) {
            if (typeof value === 'boolean') {
                url.searchParams.set(key, value ? 't' : 'f');
            } else if (value.length > 0) {
                url.searchParams.set(key, value);
            } else {
                url.searchParams.delete(key);
            }
        }

        url.searchParams.set('min_version', versions[minimumVersion]);

        window.history.replaceState({}, '', url);

        navigator.clipboard.writeText(url.toString()).then(() => {
            console.log('Shareable link copied to clipboard:', url.toString());
        }).catch(err => {
            console.error('Failed to copy shareable link:', err);
        });
    }

    function semverCompare(a: string, b: string): boolean {
        return a.localeCompare(b, 'en', { numeric: true }) === 1;
    }

    function filterIcons(list: IconList, search: string, include_lucide: boolean, minimum_version: string): IconList {
        let filtered = search.length
            ? fuse.search(search).map(result => result.item)
            : list;
        return filtered.filter(({ lucide, firstVersion, lastVersion }) => {
            return !(
                (!include_lucide && lucide) ||
                (semverCompare(firstVersion, minimum_version))
            );
        });
    }

    function onClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const iconId = target.closest('li')?.id;
        if (iconId) {
            clickedIcon = icons.find(icon => icon.id === iconId) || null;
            mouseEvent = event;
            navigator.clipboard.writeText(iconId).then(() => {
                console.log('Icon ID copied to clipboard:', iconId);
            }).catch(err => {
                console.error('Failed to copy icon ID:', err);
            });
        }
        event.preventDefault();
    }

    function onCopy(event: MouseEvent, value: string) {
        event.preventDefault();
        navigator.clipboard.writeText(value).then(() => {
            console.log('Copied value to clipboard:', value);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    function onDownload(event: MouseEvent, value: string) {
        event.preventDefault();
        const blob = new Blob([value], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${clickedIcon}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function onIdentifierClick(event: MouseEvent, identifier: string) {
        event.preventDefault();
        inputtedText = identifier;
        searchIdentifiers = true;
        searchTags = false;
        searchCategories = false;
    }
    function onCategoryClick(event: MouseEvent, category: string) {
        event.preventDefault();
        inputtedText = category;
        searchCategories = true;
        searchTags = false;
        searchIdentifiers = false;
    }

    function onTagClick(event: MouseEvent, tag: string) {
        event.preventDefault();
        inputtedText = tag;
        searchIdentifiers = false;
        searchTags = true;
        searchCategories = false;
    }

    function onClickOutside(event: CustomEvent<MouseEvent>) {
        clickedIcon = null;
        mouseEvent = null;
    }
</script>

<div class="icon-view">
    <div class="icon-header">
        <p>
            Filter the icons by name (icon name or identifier). <br>
            <span class="icon-count">
                Showing {Object.keys(filteredList).length} of {Object.keys(icons).length} icons.
            </span>
        </p>
        <div class="icon-search">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>
            </svg>
            <input bind:value={inputtedText} placeholder="Search icons..." />
        </div>

        <div class="icon-search-options">
            Include in search:&nbsp;
            <button class:is-active={searchIdentifiers} onclick={() => { searchIdentifiers = !searchIdentifiers }}>
                Identifiers
            </button>
            <button class:is-active={searchCategories} onclick={() => { searchCategories = !searchCategories }}>
                Categories
            </button>
            <button class:is-active={searchTags} onclick={() => { searchTags = !searchTags }}>
                Tags
            </button>
        </div>

        <button class="icon-share-link" onclick={copyShareLink}>
            Get shareable link
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-link">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
        </button>
    </div>

    <div class="icon-header-toggles">
        <div>
            <p>
                Hide Lucide prefix:
                <input type="checkbox" bind:checked={showLucidePrefix} />
            </p>

            <p>
                Show Lucide icons:
                <input type="checkbox" bind:checked={showLucideIcons} />
            </p>
        </div>
        <div>
            <p>
                Available in version and higher:
                <select bind:value={minimumVersion}>
                    {#each versions as version, index}
                        <option value={index}>{version}</option>
                    {/each}
                </select>
            </p>
        </div>
    </div>


    {#if clickedIcon}
            <div
                class="icon-info"
                bind:contentRect={iconInfoContentRect}
                style="
                    left: {Math.max(0, Math.min(mouseEvent.layerX - iconInfoContentRect.width / 2,  iconListContentRect.width - iconInfoContentRect.width - 30))}px;
                    top: {(mouseEvent.layerY) + 80 - (mouseEvent.layerY + 20) % 92}px;
                "
                use:clickoutside onclickoutside={onClickOutside}
            >
                {@html clickedIcon.svg}
                <div class="icon-info-content">
                    <h4>{clickedIcon.name}</h4>
                    <p>
                        <b>Icon ID:</b> <code>{clickedIcon.id}</code>
                        <button class="icon-action" onclick={(e) => { onCopy(e, clickedIcon.id); copyIdSuccess = true; setTimeout(() => { copyIdSuccess = false}, 1000)} }>
                            {#if copyIdSuccess}
                                {@html checkIcon}
                            {:else}
                                {@html copyIcon}
                            {/if}
                        </button>
                    </p>
                    <p>
                        <b>SVG:</b>
                        <button class="icon-action" onclick={(e) => { onDownload(e, clickedIcon.svg); downloadSuccess = true; setTimeout(() => { downloadSuccess = false}, 1000)} }>
                            {#if downloadSuccess}
                                {@html checkIcon}
                            {:else}
                                {@html downloadIcon}
                            {/if}
                        </button>
                        <button class="icon-action" onclick={(e) => { onCopy(e, clickedIcon.svg); copySvgSuccess = true; setTimeout(() => { copySvgSuccess = false}, 1000)} }>
                            {#if copySvgSuccess}
                                {@html checkIcon}
                            {:else}
                                {@html copyIcon}
                            {/if}
                        </button>
                    </p>
                    <p><b>Lucide:</b> {clickedIcon.lucide ? 'Yes' : 'No'}</p>
                    <p><b>Supported versions:</b> {clickedIcon.firstVersion} - {clickedIcon.lastVersion ?? versions[versions.length - 1]}</p>
                    {#if clickedIcon.categories.length}
                        <p>
                            <b>Categories:</b>
                            <span class="icon-labels">
                                {#each clickedIcon.categories as category}
                                    <button class="icon-label" onclick={(evt) => onCategoryClick(evt, category)}>{category}</button>
                                {/each}
                            </span>
                        </p>
                    {/if}
                    {#if clickedIcon.tags.length}
                        <p>
                            <b>Tags:</b>
                            <span class="icon-labels">
                                {#each clickedIcon.tags as tag}
                                    <button class="icon-label" onclick={(evt) => onTagClick(evt, tag)}>{tag}</button>
                                {/each}
                            </span>
                        </p>
                    {/if}
                    {#if clickedIcon.alternatives}
                        <p>
                            <b>Alternatives:</b>
                            <span class="icon-labels">
                                {#each clickedIcon.alternatives as alternative}
                                    <button class="icon-label" onclick={(evt) => onIdentifierClick(evt, alternative)}>{alternative}</button>
                                {/each}
                            </span>
                        </p>
                    {/if}
                </div>
            </div>
    {/if}

    <!-- TODO: I tried to use VirtualLists, but none of them seem to support CSS grids, afaics, more investigation required-->

    <ul class="icon-list"
        bind:contentRect={iconListContentRect}
    >
        {#each filteredList as { id, svg, lucide, is_new, deprecated }}
            <li id={id} class="icon-item" class:icon-deprecated={deprecated} class:icon-latest={is_new} class:icon-unique={!lucide}>
                <button onclick={onClick}>
                    {@html svg}
                    <code>
                        {(showLucidePrefix && lucide) ? id.slice(7) : id}
                    </code>
                </button>
            </li>
        {/each}
    </ul>
</div>
