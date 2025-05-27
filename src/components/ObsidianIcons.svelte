<!--
    This page has been inspired by the Typst sym and emoji reference page, found at https://typst.app/docs/reference/symbols/emoji
    Since this is meant to be a small side-project, the code quality is not the best, so please be kind.
-->
<script lang="ts">
    import Icons from '../../icon-data/icons.json?raw'
    import {onMount} from "svelte";
    import { clickoutside } from '@svelte-put/clickoutside';
    import RangeSlider from 'svelte-range-slider-pips';
    import Fuse from 'fuse.js';

    interface Icon {
        id: string;
        name: string;
        svg: string;
        lucide: boolean;
        firstVersion: string;
        lastVersion?: string;
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
    let versionRange: number[] = $state([0, versions.length - 1]);
    let filterVersionRange: boolean = $state(true);
    let iconListContentRect = $state({ left: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, x: 0, y: 0 }) as DOMRect;
    let iconInfoContentRect = $state({ left: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, x: 0, y: 0 }) as DOMRect;
    let searchIdentifiers: boolean = $state(true);
    let searchTags: boolean = $state(false);
    let searchCategories: boolean = $state(false);

    let downloadSuccess: boolean = $state(false);
    let copySvgSuccess: boolean = $state(false);
    let copyIdSuccess: boolean = $state(false);

    let filteredList = $derived.by(() => filterIcons(icons, inputtedText, showLucideIcons, filterVersionRange, versions[versionRange[0]], versions[versionRange[1]]));

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
        const searchParam = url.searchParams.get('search');
        if (searchParam) {
            inputtedText = searchParam;
        }
    });

    $effect(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('search', inputtedText);
        window.history.replaceState({}, '', url);
    });

    function semverCompare(a: string, b: string): boolean {
        return a.localeCompare(b, 'en', { numeric: true }) === 1;
    }

    function filterIcons(list: IconList, search: string, include_lucide: boolean, filter_versions: boolean, first_version: string, last_version: string): IconList {
        let filtered = search.length
            ? fuse.search(search).map(result => result.item)
            : list;
        return filtered.filter(({ lucide, firstVersion, lastVersion }) => {
            return !(
                (!include_lucide && lucide) ||
                (filter_versions && semverCompare(firstVersion, first_version)) ||
                (filter_versions && lastVersion && semverCompare(lastVersion, lastVersion))
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

    function onTagClick(event: MouseEvent, tag: string) {
        event.preventDefault();
        inputtedText = tag;
        searchIdentifiers = false;
        searchTags = true;
        searchCategories = false;
    }

    function onCategoryClick(event: MouseEvent, category: string) {
        event.preventDefault();
        inputtedText = category;
        searchCategories = true;
        searchTags = false;
        searchIdentifiers = false;
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
    </div>

    <div class="icon-header-toggles">
        <div>
            <p>
                Show Lucide prefix:
                <input type="checkbox" bind:checked={showLucidePrefix} />
            </p>

            <p>
                Show Lucide icons:
                <input type="checkbox" bind:checked={showLucideIcons} />
            </p>

            <p>
                Filter by Obsidian version:
                <input type="checkbox" bind:checked={filterVersionRange} />
            </p>
        </div>
        <div>
            Supported version range:
            <RangeSlider
                    range pushy pips
                    bind:values={versionRange}
                    min={0}
                    max={versions.length - 1}
                    all="label"
                    formatter={(value, index, percent) => versions[value] || ''}
                    disabled={!filterVersionRange}
            />
        </div>
    </div>


    {#if clickedIcon}
            <div
                class="icon-info"
                bind:contentRect={iconInfoContentRect}
                style="
                    left: {Math.max(0, Math.min(mouseEvent.layerX - iconInfoContentRect.width / 2,  iconListContentRect.width - iconInfoContentRect.width - 30))}px;
                    top: {(mouseEvent.layerY) + 78 - (mouseEvent.layerY + 70) % 92}px;
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
                </div>
            </div>
    {/if}

    <!-- TODO: I tried to use VirtualLists, but none of them seem to support CSS grids, afaics, more investigation required-->

    <ul class="icon-list"
        bind:contentRect={iconListContentRect}
    >
        {#each filteredList as { id, svg, lucide }}
            <li id={id} class="icon-item">
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
