---
title: Embeddable Markdown Renderer
editUrl: false
description: How to use get access to, and use, the markdown editor that Obsidian uses
---

:::note
All credits for this snippet go to MgMeyers (maintainer of the Kanban plugin), who originally wrote this code.
:::

If you have ever tried to get an input field where the Markdown syntax is properly rendered, you know that it isn't as simple as creating a `<textarea>` or creating the `MarkdownView`.

The snippet below offers a way to create a view or field, which uses in essence the same editor that Obsidian uses. This means that all markup is rendered, vim is supported, commands can be executed, etc.

:::caution[Warning]
However, any CodeMirror editor extensions provided by other plugins ***will not*** be added to this editor instance. You can still re-add your own plugins in the `buildLocalExtensions` method.
:::

### Component

```ts
/**
 * All credits go to mgmeyers for figuring out how to grab the proper editor prototype
 * 	 and making it easily deployable
 * Changes made to the original code:
 * 	 - Refactored to JS-only syntax (original code made use of React)
 * 	 - Added blur completion
 * 	 - Added some comments on how the code functions
 * 	 - Made editor settings fully optional
 * 	 - Allow all editor commands to function on this editor
 * 	 - Added typings for the editor(s) (will be added to obsidian-typings)
 * Make sure to also check out the original source code here: https://github.com/mgmeyers/obsidian-kanban/blob/main/src/components/Editor/MarkdownEditor.tsx
 */

import {
	App, Constructor, Keymap, Scope, ScrollableMarkdownEditor,
	TFile, WidgetEditorView, WorkspaceLeaf,
} from "obsidian";

import {EditorSelection, Extension, Prec} from "@codemirror/state";
import {EditorView, keymap, placeholder, ViewUpdate} from "@codemirror/view";

import {around} from "monkey-around";


function resolveEditorPrototype(app: App) {
	// Create a temporary editor to resolve the prototype of ScrollableMarkdownEditor
	const widgetEditorView = app.embedRegistry.embedByExtension.md(
		{ app, containerEl: document.createElement('div') },
		null as unknown as TFile,
		'',
	) as WidgetEditorView;

	// Mark as editable to instantiate the editor
	widgetEditorView.editable = true;
	widgetEditorView.showEditor();
	const MarkdownEditor = Object.getPrototypeOf(Object.getPrototypeOf(widgetEditorView.editMode!));

	// Unload to remove the temporary editor
	widgetEditorView.unload();

	return MarkdownEditor.constructor as Constructor<ScrollableMarkdownEditor>;
}

interface MarkdownEditorProps {
	cursorLocation?: { anchor: number, head: number };
	value?: string;
	cls?: string;
	placeholder?: string;

	onEnter: (editor: EmbeddableMarkdownEditor, mod: boolean, shift: boolean) => boolean;
	onEscape: (editor: EmbeddableMarkdownEditor) => void;
	onSubmit: (editor: EmbeddableMarkdownEditor) => void;
	onBlur: (editor: EmbeddableMarkdownEditor) => void;
	onPaste: (e: ClipboardEvent, editor: EmbeddableMarkdownEditor) => void;
	onChange: (update: ViewUpdate) => void;
}

const defaultProperties: MarkdownEditorProps = {
	cursorLocation: { anchor: 0, head: 0 },
	value: '',
	cls: '',
	placeholder: '',

	onEnter: () => false,
	onEscape: () => {},
	onSubmit: () => {},
	// NOTE: Blur takes precedence over Escape (this can be changed)
	onBlur: () => {},
	onPaste: () => {},
	onChange: () => {},
}


export class EmbeddableMarkdownEditor extends resolveEditorPrototype(app) implements ScrollableMarkdownEditor {
	options: MarkdownEditorProps;
	initial_value: string;
	scope: Scope;

	/**
	 * Construct the editor
	 * @remark Takes 5ms to fully construct and attach
	 * @param app - Reference to App instance
	 * @param container - Container element to add the editor to
	 * @param options - Options for controling the initial state of the editor
	 */
	constructor(app: App, container: HTMLElement, options: Partial<MarkdownEditorProps>) {
		super(app, container, {
			app,
			// This mocks the MarkdownView functions, which is required for proper functioning of scrolling
			onMarkdownScroll: () => {},
			getMode: () => 'source',
		});
		this.options = {...defaultProperties, ...options};
		this.initial_value = this.options.value!;
		this.scope = new Scope(this.app.scope);
		// NOTE: Hotkeys take precedence over CM keymap, so scope is introduced to allow for specific hotkeys to be overwritten
		//   In this case, since Mod+Enter is linked to the "Open link in new leaf" command, but it is also the default user action for submitting the editor,
		//      the scope is used to prevent the hotkey from executing (by returning `true`)
		// TODO: It is also possible to allow both behaviours to coexist:
		//     1) Fetch the command via hotkeyManager
		//     2) Execute the command callback
		//     3) Return the result of the callback (callback returns false if callback could not execute)
		//     		(In this case, if cursor is not on a link token, the callback will return false, and onEnter will be applied)
		this.scope.register(["Mod"], "Enter", (e, ctx) => {
			return true;
		});

		// Since the commands expect that this is a MarkdownView (with editMode as the Editor itself),
		//   we need to mock this by setting both the editMode and editor to this instance and its containing view respectively
		// @ts-expect-error (editMode is normally a MarkdownSubView)
		this.owner.editMode = this;
		this.owner.editor = this.editor;

		this.set(options.value || '');
		this.register(
			around(this.app.workspace, {
				// @ts-expect-error (Incorrectly matches the deprecated setActiveLeaf method)
				setActiveLeaf: (oldMethod: (leaf: WorkspaceLeaf, params?: ({ focus?: boolean })) => void) =>
					(leaf: WorkspaceLeaf, params: { focus?: boolean }) => {
						// If the editor is currently focused, prevent the workspace setting the focus to a workspaceLeaf instead
						if (!this.activeCM.hasFocus)
							oldMethod.call(this.app.workspace, leaf, params);
					},
			}),
		);

		// Execute onBlur when the editor loses focus
		// NOTE: Apparently Chrome does a weird thing where removing an element from the DOM triggers a blur event
		//		 (Hence why the ._loaded check is necessary)
		if (this.options.onBlur !== defaultProperties.onBlur) {
			this.editor.cm.contentDOM.addEventListener('blur', () => {
				this.app.keymap.popScope(this.scope);
				if (this._loaded)
					this.options.onBlur(this)
			});
		}

		// Whenever the editor is focused, set the activeEditor to the mocked view (this.owner)
		// This allows for the editorCommands to actually work
		this.editor.cm.contentDOM.addEventListener('focusin', (e) => {
			this.app.keymap.pushScope(this.scope);
			this.app.workspace.activeEditor = this.owner;
		});

		if (options.cls) this.editorEl.classList.add(options.cls);
		if (options.cursorLocation) {
			this.editor.cm.dispatch({
				selection: EditorSelection.range(options.cursorLocation.anchor, options.cursorLocation.head),
			});
		}
	}

	get value() {
		return this.editor.cm.state.doc.toString();
	}

	onUpdate(update: ViewUpdate, changed: boolean) {
		super.onUpdate(update, changed);
		if (changed) this.options.onChange(update);
	}

	/**
	 * Loads the CM extensions for rendering Markdown and handling user inputs
	 * Note that other plugins will not be able to send updates to these extensions to change configurations
	 */
	buildLocalExtensions(): Extension[] {
		const extensions = super.buildLocalExtensions();
		if (this.options.placeholder) extensions.push(placeholder(this.options.placeholder));

		/* Editor extension for handling specific user inputs */
		extensions.push(EditorView.domEventHandlers({ paste: (event) => {
			this.options.onPaste(event, this);
		}}));
		extensions.push(Prec.highest(keymap.of([
			{
				key: 'Enter',
				run: (cm) => this.options.onEnter(this, false, false),
				shift: (cm) => this.options.onEnter(this, false, true)
			},
			{
				key: 'Mod-Enter',
				run: (cm) => this.options.onEnter(this, true, false),
				shift: (cm) => this.options.onEnter(this, true, true)
			},
			{
				key: 'Escape',
				run: (cm) => {
					this.options.onEscape(this);
					return true;
				},
				preventDefault: true
			}
		])));

		/* Additional Editor extensions (renderers, ...) */


		return extensions;
	}

	/**
	 * Ensure that the editor is properly destroyed when the view is closed
	 */
	destroy(): void {
		if (this._loaded)
			this.unload();
		this.app.keymap.popScope(this.scope);
		this.app.workspace.activeEditor = null;
		this.containerEl.empty();
		super.destroy();
	}

	/**
	 * When removing as a component, destroy will also get invoked
	 */
	onunload() {
		super.onunload();
		this.destroy();
	}
}
```

### Example Usage

The code below gives an example of how you might mount this Editor instance to a View, for instance. Do note that you can technically add the Editor anywhere you want.

```ts
/**
 * This view provides an example on how you can utilise the EmbeddableMarkdownEditor
 * Note that it is not required for the editor be marked to a leaf or view,
 *   but you do need to be careful in managing the editor lifecycle (via registering it to a component or destroying it manually) 
 */

import {EmbeddableMarkdownEditor} from "./embeddable-editor";
import SamplePlugin from "./main";
import {ItemView, Notice, WorkspaceLeaf} from "obsidian";

export const SAMPLE_VIEW_ID = "example-view";
export class SampleView extends ItemView {
	editors: HTMLElement[] = [];

	constructor(private plugin: SamplePlugin, leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return SAMPLE_VIEW_ID;
	}

	getDisplayText() {
		return "Sample View";
	}

	createEditor(container: HTMLElement) {
		// The editor can easily be destructed via calling the.removeChild(editor) method (if registered),
		//    or by calling editor.destroy()
		return this.addChild(new EmbeddableMarkdownEditor(this.app, container, {
			onEscape: (editor) => {
				new Notice(`Escaped the editor: (${editor.initial_value})`);
				this.removeChild(editor);
			},
			onEnter: (editor, mod: boolean, shift: boolean) => {
				if (mod) {
					new Notice(`Ctrl+Entered on the editor: (${editor.value})`);
					this.removeChild(editor);
				}
				return false;
			},
			onSubmit: (editor) => {
				new Notice(`Submitted on the editor: (${editor.value})`);
				this.removeChild(editor);
			},
			// onBlur: (editor) => {
			// 	new Notice(`Unfocused the editor: (${editor.initial_value})`);
			// 	this.removeChild(editor);
			// },
			value: "Interesting text\n[Some link](https://www.google.com/)",
		}));
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();

		container.style.display = 'flex';
		container.style.flexDirection = 'column';
		container.style.gap = '1%';


		const numEditors = 3;
		for (let i = 0; i < numEditors; i++) {
			const editorContainer = container.createDiv({ cls: 'sample-editor' });
			editorContainer.style.height = Math.floor((100 - numEditors) / numEditors) + "%";
			editorContainer.style.border = "1px solid var(--background-modifier-border)";

			this.editors.push(editorContainer);
			this.createEditor(editorContainer);
		}
	}
}
```
