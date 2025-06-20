<!--
    This page has been inspired by the Typst sym and emoji reference page, found at https://typst.app/docs/reference/symbols/emoji
    Since this is meant to be a small side-project, the code quality is not the best, so please be kind.
-->
<script lang="ts">
    import Icons from '../../icon-data/icons.json?raw'
    import {
        checkIcon,
        copyIcon,
        downloadIcon,
        eyeIcon,
        tagIcon,
        categoryIcon,
        searchIcon,
        linkIcon,
        identifierIcon, newIcon, deprecatedIcon, uniqueIcon
    } from './icons';

    import {onMount} from "svelte";
    import {clickoutside} from '@svelte-put/clickoutside';
    import {tooltip} from './tooltip';

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
    const { icons, versions, tags, categories } = iconsInformation;
    const LATEST_VERSION_CUTOFF = '1.8.10';

    // EXPL: Search and filter settings
    let inputtedText: string = $state('');
    let addLucidePrefix: boolean = $state(false);
    let filterNewIcons: boolean = $state(false);
    let filterDeprecatedIcons: boolean = $state(false);
    let filterUniqueIcons: boolean = $state(false);
    let minimumVersion: number = $state(versions.findIndex(v => v === LATEST_VERSION_CUTOFF));
    let searchIdentifiers: boolean = $state(true);
    let searchTags: boolean = $state(false);
    let searchCategories: boolean = $state(false);

    // EXPL: Search box hints rendering
    let currentHint: number | null = $state(null);
    let searchHintsElement: HTMLDivElement | null = $state(null);

    // EXPL: Icon info box positioning
    let mouseEvent: MouseEvent | null = $state(null);
    let clickedIcon: Icon | null = $state(null);
    let iconListContentRect = $state({ left: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, x: 0, y: 0 }) as DOMRect;
    let iconInfoContentRect = $state({ left: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, x: 0, y: 0 }) as DOMRect;

    // EXPL: Copy/download success states
    let downloadSuccess: boolean = $state(false);
    let copySvgSuccess: boolean = $state(false);
    let copyIdSuccess: boolean = $state(false);

    let searchPlaceholder: string = $derived.by(() => {
        if (searchIdentifiers && searchTags && searchCategories) {
            return 'Search by identifier, tag, or category...';
        } else if (searchIdentifiers && searchTags) {
            return 'Search by identifier or tag...';
        } else if (searchIdentifiers && searchCategories) {
            return 'Search by identifier or category...';
        } else if (searchTags && searchCategories) {
            return 'Search by tag or category...';
        } else if (searchIdentifiers) {
            return 'Search by identifier...';
        } else if (searchTags) {
            return 'Search by tag...';
        } else if (searchCategories) {
            return 'Search by category...';
        }
        return 'Search icons...';
    });

    let filteredList = $derived.by(() => filterIcons(icons, inputtedText, filterNewIcons, filterDeprecatedIcons, filterUniqueIcons, versions[minimumVersion]));

    let allSearchableItems = $derived.by(() => {
        return [
            ...(searchTags ? tags.map(value => ({value: value, type: "tag"})) : []),
            ...(searchCategories ? categories.map(value => ({value: value, type: "category"})) : []),
        ].sort((a, b) => a.value.localeCompare(b.value));
    }) as { value: string, type: 'tag' | 'category' }[];

    let groupFuse = $derived.by(() => new Fuse(allSearchableItems, { keys: ["value"], threshold: 0.05, includeMatches: true, shouldSort: false }));
    let iconFuse = $derived.by(() => {
        const keys: string[] = [];
        if (searchIdentifiers) keys.push('id');
        if (searchTags) keys.push('tags');
        if (searchCategories) keys.push('categories');

        return new Fuse(icons, {
            keys,
            threshold: 0.22,
        });
    });

    let searchableItems = $derived.by(() => {
        return inputtedText.length
            ? groupFuse
                .search(inputtedText)
                .map(result => ({
                    value: result.item,
                    markings: result.matches![0].indices
                        .reduce((acc, [start, stop], idx) => {
                            const previous_end = acc.length ? acc[acc.length - 1].to : 0;
                            if (start > previous_end) {
                                acc.push({ start: previous_end, to: start, mark: false });
                            }
                            acc.push({ start, to: stop + 1, mark: true });
                            if (idx === result.matches![0].indices.length - 1 && stop + 1 < result.item.value.length) {
                                acc.push({ start: stop + 1, to: result.item.value.length, mark: false });
                            }
                            return acc;
                        }, [] as {start: number, to: number, mark: boolean}[])
                    }))
            : allSearchableItems.map(item => ({value: item, markings: []}));
    });

    // EXPL: Prevent nasty bug where info box will keep resizing itself to fit against the edge, which it shouldn't do
    let previousWidth = iconInfoContentRect.width;
    let infoBoxX = $derived.by(() => {
        let width = Math.abs(previousWidth - iconInfoContentRect.width) < 25 ? previousWidth : iconInfoContentRect.width;
        previousWidth = iconInfoContentRect.width;
        return Math.max(0, Math.min((mouseEvent?.layerX ?? 0) - width / 2, iconListContentRect.width - width - 30))
    });
    let infoBoxY = $derived.by(() =>
        (mouseEvent?.layerY ?? 0) + 105 - ((mouseEvent?.layerY ?? 0) + 5) % 92
    );

    $effect(() => {
        if (inputtedText.length > 0 && currentHint === null) {
            currentHint = 0;
        } else if (inputtedText.length === 0) {
            currentHint = null;
        }
    })

    //     let inputtedText: string = $state('');
    // let addLucidePrefix: boolean = $state(false);
    // let filterNewIcons: boolean = $state(false);
    // let filterDeprecatedIcons: boolean = $state(false);
    // let filterUniqueIcons: boolean = $state(false);
    // let minimumVersion: number = $state(versions.findIndex(v => v === '1.8.10'));
    // let searchIdentifiers: boolean = $state(true);
    // let searchTags: boolean = $state(false);
    // let searchCategories: boolean = $state(false);

    onMount(() => {
        const url = new URL(window.location.href);
        inputtedText = url.searchParams.get('q') || '';
        addLucidePrefix = url.searchParams.has('prefix') ? url.searchParams.get('prefix') === 't' : addLucidePrefix;
        filterNewIcons = url.searchParams.has('new') ? url.searchParams.get('new') === 't' : filterNewIcons;
        filterDeprecatedIcons = url.searchParams.has('rem') ? url.searchParams.get('rem') === 't' : filterDeprecatedIcons;
        filterUniqueIcons = url.searchParams.has('unq') ? url.searchParams.get('unq') === 't' : filterUniqueIcons;
        minimumVersion = url.searchParams.has('min_version') ? versions.findIndex(v => v === url.searchParams.get('min_version')) : minimumVersion;
        searchIdentifiers = url.searchParams.has('id') ? url.searchParams.get('id') === 't' : searchIdentifiers;
        searchTags = url.searchParams.has('tag') ? url.searchParams.get('tag') === 't' : searchTags;
        searchCategories = url.searchParams.has('cat') ? url.searchParams.get('cat') === 't' : searchCategories;
    });

    function copyShareLink() {
        const url = new URL(window.location.href);
        const check: [string, string | boolean][] = [
            ['q', inputtedText],
            ['prefix', addLucidePrefix],

            ['new', filterNewIcons],
            ['rem', filterDeprecatedIcons],
            ['unq', filterUniqueIcons],

            ['id', searchIdentifiers],
            ['tag', searchTags],
            ['cat', searchCategories],
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

    function filterIcons(list: IconList, search: string, focus_new: boolean, focus_deprecated: boolean, focus_unique: boolean,
    minimum_version: string): IconList {
        let filtered = search?.length
            ? iconFuse.search(search).map(result => result.item)
            : list;
        return filtered.filter(({ lucide, firstVersion, is_new, deprecated, lastVersion }) => {
            return !(
                (focus_new && !is_new) ||
                (focus_deprecated && !deprecated) ||
                (focus_unique && lucide) ||
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

    function focusSearchGroup(event: Event, type: 'identifier' | 'tag' | 'category', value: string) {
        event.preventDefault();
        inputtedText = value;
        searchIdentifiers = type === 'identifier';
        searchTags = type === 'tag';
        searchCategories = type === 'category';
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }

    function onClickOutside(event: CustomEvent<MouseEvent>) {
        clickedIcon = null;
        mouseEvent = null;
    }

    function toggleFilterFocus(idx: number) {
        filterNewIcons = idx === 0 ? !filterNewIcons : false;
        filterDeprecatedIcons = idx === 1 ? !filterDeprecatedIcons : false;
        filterUniqueIcons = idx === 2 ? !filterUniqueIcons : false;
    }
</script>

<div class="icon-util-view">
    <div class="icon-util-settings">
        <div class="icon-util-top-bar">
            <span class="icon-util-icons-count">
                Showing {Object.keys(filteredList).length} of {Object.keys(icons).length} icons
            </span>

            <button class="icon-share-link" onclick={copyShareLink}>
                Get shareable link
                {@html linkIcon}
            </button>
        </div>

        <hr/>

        <div>
            <button class="icon-util-icon-action" onclick={() => { addLucidePrefix = !addLucidePrefix }} class:icon-util-icon-action-active={addLucidePrefix} use:tooltip aria-label="Show lucide prefix in icon ID">
                {@html eyeIcon}
            </button>
        </div>

        <div class="icon-util-search-bar">
            {@html searchIcon}
            <input
                    bind:value={inputtedText}
                    placeholder={searchPlaceholder}
                    onkeydown={(e) => {
                        if (e.key === 'Enter') {
                            const item = searchableItems[currentHint];
                            focusSearchGroup(e, item.value.type, item.value.value);
                        } else if (e.key === 'ArrowDown') {
                            currentHint = (currentHint + 1) % searchableItems.length;
                            searchHintsElement.children[currentHint]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                        } else if (e.key === 'ArrowUp') {
                            currentHint = (currentHint - 1 + searchableItems.length) % searchableItems.length;
                            searchHintsElement.children[currentHint]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });

                        }
                    }}
            />
            <div class="icon-util-search-hints" style={(allSearchableItems.length) ? "" : "display: none"} bind:this={searchHintsElement}>
                {#if searchableItems.length}
                    {#each searchableItems as {value: item, markings}, idx}
                        <button class="icon-util-search-hint" class:icon-util-search-hint-focused={currentHint === idx} onclick={(evt) => { focusSearchGroup(evt, item.type, item.value) }}>
                            <div>
                                {#if searchCategories && searchTags}
                                    {#if item.type === 'tag'}
                                        {@html tagIcon}
                                    {:else}
                                        {@html categoryIcon}
                                    {/if}
                                {/if}
                            </div>
                            <div>
                                {#if markings.length}
                                    {#each markings as {start, to, mark}}
                                        <span class={mark ? 'icon-util-search-hint-highlight' : ''}>
                                            {item.value.slice(start, to)}
                                        </span>
                                    {/each}
                                {:else}
                                    <span>{item.value}</span>
                                {/if}
                            </div>
                        </button>
                    {/each}
                {:else}
                    <span>No results found</span>
                {/if}
            </div>
        </div>

        <div class="icon-util-search-settings">
            <button class="icon-util-icon-action" onclick={() => { searchIdentifiers = !searchIdentifiers }} class:icon-util-icon-action-active={searchIdentifiers} use:tooltip aria-label="Search by identifier">
                {@html identifierIcon}
            </button>

            <button class="icon-util-icon-action" onclick={() => { searchCategories = !searchCategories }} class:icon-util-icon-action-active={searchCategories} use:tooltip aria-label="Search by category">
                {@html categoryIcon}
            </button>

            <button class="icon-util-icon-action" onclick={() => { searchTags = !searchTags }} class:icon-util-icon-action-active={searchTags} use:tooltip aria-label="Search by tag">
                {@html tagIcon}
            </button>
        </div>

        <br/>

        <div class="icon-util-focus-groups">
           <button class="icon-util-focus-group icon-util-focus-group-new" onclick={() => { toggleFilterFocus(0) }} class:icon-util-focus-group-active={filterNewIcons} use:tooltip aria-label={`Focus on icons added in v${LATEST_VERSION_CUTOFF} and higher`}>
               {@html newIcon}
               New
            </button>

            <button class="icon-util-focus-group icon-util-focus-group-deprecated" onclick={() => { toggleFilterFocus(1) }} class:icon-util-focus-group-active={filterDeprecatedIcons} use:tooltip aria-label="Focus on deprecated icons">
                {@html deprecatedIcon}
                Deprecated
            </button>

            <button class="icon-util-focus-group icon-util-focus-group-unique" onclick={() => { toggleFilterFocus(2) }} class:icon-util-focus-group-active={filterUniqueIcons} use:tooltip aria-label="Focus on icons not from Lucide">
                {@html uniqueIcon}
                Obsidian-only
            </button>
        </div>

        <div>
            <p>
                Available in version
                <select bind:value={minimumVersion}>
                    {#each versions as version, index}
                        <option value={index}>{version}</option>
                    {/each}
                </select>
                and higher
            </p>
        </div>
    </div>


    {#if clickedIcon}
            <div
                class="icon-util-info-box"
                bind:contentRect={iconInfoContentRect}
                style="left: {infoBoxX}px; top: {infoBoxY}px;"
                use:clickoutside onclickoutside={onClickOutside}
            >
                {@html clickedIcon.svg}
                <div class="icon-util-info-box-content">
                    <h4>{clickedIcon.name}</h4>
                    <p>
                        <b>Icon ID:</b> <code>{clickedIcon.id}</code>
                        <button class="icon-util-icon-action" onclick={(e) => { onCopy(e, clickedIcon.id); copyIdSuccess = true; setTimeout(() => { copyIdSuccess = false}, 1000)} }>
                            {#if copyIdSuccess} {@html checkIcon} {:else} {@html copyIcon} {/if}
                        </button>
                    </p>
                    <p>
                        <b>SVG:</b>
                        <button class="icon-util-icon-action" onclick={(e) => { onDownload(e, clickedIcon.svg); downloadSuccess = true; setTimeout(() => { downloadSuccess = false}, 1000)} }>
                            {#if downloadSuccess} {@html checkIcon} {:else} {@html downloadIcon} {/if}
                        </button>
                        <button class="icon-util-icon-action" onclick={(e) => { onCopy(e, clickedIcon.svg); copySvgSuccess = true; setTimeout(() => { copySvgSuccess = false}, 1000)} }>
                            {#if copySvgSuccess} {@html checkIcon} {:else} {@html copyIcon} {/if}
                        </button>
                    </p>
                    <p><b>Lucide:</b> {clickedIcon.lucide ? 'Yes' : 'No'}</p>
                    <p><b>Supported versions:</b> {clickedIcon.firstVersion} - {clickedIcon.lastVersion ?? versions[versions.length - 1]}</p>
                    {#if clickedIcon.categories.length}
                        <p>
                            <b>Categories:</b>
                            <span class="icon-util-info-box-labels">
                                {#each clickedIcon.categories as category}
                                    <button class="icon-util-info-box-label" onclick={(evt) => focusSearchGroup(evt, 'category', category)}>{category}</button>
                                {/each}
                            </span>
                        </p>
                    {/if}
                    {#if clickedIcon.tags.length}
                        <p>
                            <b>Tags:</b>
                            <span class="icon-util-info-box-labels">
                                {#each clickedIcon.tags as tag}
                                    <button class="icon-util-info-box-label" onclick={(evt) => focusSearchGroup(evt, 'tag', tag)}>{tag}</button>
                                {/each}
                            </span>
                        </p>
                    {/if}
                    {#if clickedIcon.alternatives}
                        <p>
                            <b>Alternatives:</b>
                            <span class="icon-util-info-box-labels">
                                {#each clickedIcon.alternatives as alternative}
                                    <button class="icon-util-info-box-label" onclick={(evt) => focusSearchGroup(evt, 'identifier', alternative)}>{alternative}</button>
                                {/each}
                            </span>
                        </p>
                    {/if}
                </div>
            </div>
    {/if}

    <!-- TODO: This could use a VirtualLists, but couldn't find a package that supports CSS grids -->
    <ul class="icon-util-grid"
        bind:contentRect={iconListContentRect}
    >
        {#each filteredList as { id, svg, lucide, is_new, deprecated }}
            <li id={id} class="icon-util-grid-item" class:icon-util-grid-item-deprecated={deprecated} class:icon-util-grid-item-new={is_new} class:icon-util-grid-item-unique={!lucide}>
                <button onclick={onClick}>
                    {@html svg}
                    <code>
                        {(!addLucidePrefix && lucide) ? id.slice(7) : id}
                    </code>
                </button>
            </li>
        {/each}
    </ul>
</div>
