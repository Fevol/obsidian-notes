<!--
    This page has been inspired by the Typst sym and emoji reference page, found at https://typst.app/docs/reference/symbols/emoji
-->
<script lang="ts">
    import Icons from '../assets/icon-data/1.9.1.json?raw'
    import { Portal } from '@jsrob/svelte-portal';
    import {onMount} from "svelte";
    import { clickoutside } from '@svelte-put/clickoutside';

    type IconList = {
        [key: string]: {
            name: string;
            svg: string;
            lucide: boolean;
        };
    };

    const iconList: IconList = JSON.parse(Icons)
    let searchTerm: string = $state('ee');
    let filtered_list = $derived.by(() => filterIcons(iconList, searchTerm));
    let clickedIcon: string | null = $state(null);
    let mouseEvent: MouseEvent | null = $state(null);

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

    function filterIcons(list: IconList, search: string): IconList {
        if (!search) {
            return list;
        }
        const lowercase_search = search.toLowerCase();
        return Object.entries(list).reduce((acc, [key, value]) => {
            if (value.name.toLowerCase().includes(lowercase_search)) {
                acc[key as keyof typeof acc] = value;
            }
            return acc;
        }, {});
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

    function onCopy(value: string) {
        navigator.clipboard.writeText(value).then(() => {
            console.log('Copied value to clipboard:', value);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    function onClickOutside(event: CustomEvent<MouseEvent>) {
        clickedIcon = null;
        mouseEvent = null;
    }
</script>

<div class="icon-header">
    <p>
        Filter the icons by name (icon name or identifier). <br>
        <span class="icon-count">
            Showing {Object.keys(filtered_list).length} of {Object.keys(iconList).length} icons.
        </span>
    </p>
    <div class="icon-search">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>
        </svg>
        <input bind:value={searchTerm} placeholder="Search icons..." />
    </div>
</div>


{#if clickedIcon}
    <Portal target="body">
        <div class="icon-info" style="position: absolute; top: {mouseEvent?.clientY}px; left: {mouseEvent?.clientX}px;" use:clickoutside onclickoutside={onClickOutside}>
            {@html iconList[clickedIcon].svg}
            <div class="icon-info-content">
                <h4>{iconList[clickedIcon].name}</h4>
                <p>
                    Icon ID: <code>{clickedIcon}</code>
                    <button onclick={() => onCopy(clickedIcon)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                        </svg>
                    </button>
                </p>
                <p>
                    SVG: <a href={`data:image/svg+xml;utf8,${encodeURIComponent(iconList[clickedIcon].svg)}`} download={`${clickedIcon}.svg`}>Download</a>
                    <button onclick={() => onCopy(iconList[clickedIcon].svg)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                        </svg>
                    </button>
                </p>
                <p>Lucide: {iconList[clickedIcon].lucide ? 'Yes' : 'No'}</p>
            </div>
        </div>
    </Portal>
{/if}

<!-- TODO: I tried to use VirtualLists, but none of them seem to support CSS grids, afaics, more investigation required-->

<ul class="icon-list">
    {#each Object.entries(filtered_list) as [key, { name, svg, lucide }]}
        <li id={key} class="icon-item">
            <button onclick={onClick}>
                {@html svg}
                <code>{key}</code>
            </button>
        </li>
    {/each}
</ul>
