<!--
    This page has been inspired by the Typst sym and emoji reference page, found at https://typst.app/docs/reference/symbols/emoji
    Since this is meant to be a small side-project, the code quality is not the best, so please be kind.
-->
<script lang="ts">
    import Icons from '../assets/icon-data/icons.json?raw'
    import { Portal } from '@jsrob/svelte-portal';
    import {onMount} from "svelte";
    import { clickoutside } from '@svelte-put/clickoutside';
    import RangeSlider from 'svelte-range-slider-pips';

    type IconList = {
        [key: string]: {
            name: string;
            svg: string;
            lucide: boolean;
            firstVersion: string;
            lastVersion?: string;
        };
    };

    const iconsInformation = JSON.parse(Icons) as {
        icons: IconList;
        versions: string[];
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


    let searchTerm: string = $state('');
    let showLucidePrefix: boolean = $state(true);
    let showLucideIcons: boolean = $state(true);
    let clickedIcon: string | null = $state(null);
    let mouseEvent: MouseEvent | null = $state(null);
    let versionRange: number[] = $state([0, versions.length - 1]);
    let filterVersionRange: boolean = $state(true);

    let downloadSuccess: boolean = $state(false);
    let copySvgSuccess: boolean = $state(false);
    let copyIdSuccess: boolean = $state(false);

    let filteredList = $derived.by(() => filterIcons(icons, searchTerm, showLucideIcons, filterVersionRange, versions[versionRange[0]], versions[versionRange[1]]));

    onMount(() => {
        const url = new URL(window.location.href);
        const searchParam = url.searchParams.get('search');
        if (searchParam) {
            searchTerm = searchParam;
        }
    });

    $effect(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('search', searchTerm);
        window.history.replaceState({}, '', url);
    });

    function semverCompare(a: string, b: string): boolean {
        return a.localeCompare(b, 'en', { numeric: true }) === 1;
    }

    function filterIcons(list: IconList, search: string, include_lucide: boolean, filter_versions: boolean, first_version: string, last_version: string): IconList {
        const lowercase_search = search.toLowerCase();
        return Object.fromEntries(Object.entries(list).filter(([key, value]) => {
            return !(
                (!include_lucide && value.lucide) ||
                (search.length && !(value.name.toLowerCase().includes(lowercase_search) || key.toLowerCase().includes(lowercase_search))) ||
                (filter_versions && semverCompare(value.firstVersion, first_version)) ||
                (filter_versions && value.lastVersion && semverCompare(last_version, value.lastVersion))
            );
        }));
    }

    function onClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const iconId = target.closest('li')?.id;
        if (iconId) {
            clickedIcon = iconId;
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
            <input bind:value={searchTerm} placeholder="Search icons..." />
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
        <Portal target="body">
            <div class="icon-info" style="position: absolute; top: {mouseEvent?.clientY}px; left: {mouseEvent?.clientX}px;" use:clickoutside onclickoutside={onClickOutside}>
                {@html icons[clickedIcon].svg}
                <div class="icon-info-content">
                    <h4>{icons[clickedIcon].name}</h4>
                    <p>
                        Icon ID: <code>{clickedIcon}</code>
                        <button class="icon-action" onclick={(e) => { onCopy(e, clickedIcon); copyIdSuccess = true; setTimeout(() => { copyIdSuccess = false}, 1000)} }>
                            {#if copyIdSuccess}
                                {@html checkIcon}
                            {:else}
                                {@html copyIcon}
                            {/if}
                        </button>
                    </p>
                    <p>
                        SVG:
                        <button class="icon-action" onclick={(e) => { onDownload(e, icons[clickedIcon].svg); downloadSuccess = true; setTimeout(() => { downloadSuccess = false}, 1000)} }>
                            {#if downloadSuccess}
                                {@html checkIcon}
                            {:else}
                                {@html downloadIcon}
                            {/if}
                        </button>
                        <button class="icon-action" onclick={(e) => { onCopy(e, icons[clickedIcon].svg); copySvgSuccess = true; setTimeout(() => { copySvgSuccess = false}, 1000)} }>
                            {#if copySvgSuccess}
                                {@html checkIcon}
                            {:else}
                                {@html copyIcon}
                            {/if}
                        </button>
                    </p>
                    <p>Lucide: {icons[clickedIcon].lucide ? 'Yes' : 'No'}</p>
                    <p>Supported versions: {icons[clickedIcon].firstVersion} - {icons[clickedIcon].lastVersion ?? versions[versions.length - 1]}</p>
                </div>
            </div>
        </Portal>
    {/if}

    <!-- TODO: I tried to use VirtualLists, but none of them seem to support CSS grids, afaics, more investigation required-->

    <ul class="icon-list">
        {#each Object.entries(filteredList) as [key, { name, svg, lucide }]}
            <li id={key} class="icon-item">
                <button onclick={onClick}>
                    {@html svg}
                    <code>
                        {(showLucidePrefix && lucide) ? key.slice(7) : key}
                    </code>
                </button>
            </li>
        {/each}
    </ul>
</div>
