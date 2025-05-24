---
title: Markdown Postprocessor Update
description: How to reload attached PostProcessor's added by your plugin
---
This page describes two approaches for reloading _all_ `postProcessor`'s that are added by your plugin. This may be necessary for when you have changed some setting in your plugin, and all your `postProcessor` instances should be updated to account for this new setting.

### Full Reload
The snippet below will *fully* reload all reading views in the app.

**ADVANTAGES:**
- Simple usage
- Less likelihood of malformed HTML

**DISADVANTAGES:**
- Can be slow when many views are open
- Unnecessary re-rendering of unchanged elements 

```ts
export function fullPostProcessorUpdate() {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		if (leaf.view instanceof MarkdownView) {
			leaf.view.previewMode.rerender(true);
		}
	}
}
```


### Surgical Reload
This snippet will *partially* re-render all reading views in the app.

**ADVANTAGES:**
- More efficient, only re-rendering what needs to be re-rendered

**DISADVANTAGES:**
- There is a higher likelihood that the output has artifacts

```ts
// MASSIVE credits to depose/dp0z for the implementation
export function postProcessorUpdate() {
	for (const leaf of app.workspace.getLeavesOfType("markdown")) {
		if (leaf.view instanceof MarkdownView) {
			// To prevent rendering conflicts with other plugins and possible duplications (and improved performance),
			//       make sure to *only* rerender elements that need to be rerendered (i.e.: what your postprocessor outputs)
			// Also, give your elements a proper identifier, such that only the relevant elements will be selected
			for (const section of leaf.view.previewMode.renderer.sections.filter(s => s.el.querySelector('ELEMENT-IDENTIFIER'))) {
				// This code flags the section containing your element as an element that has to be rerendered 
				section.rendered = false;
				section.html = '';
			}
			
			// Rerender all flagged elements
			view.previewMode.renderer.queueRender();
		}
	}
}
```