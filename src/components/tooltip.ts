export function tooltip(element: HTMLElement) {
    let div: HTMLDivElement;
    let text: string;

    function mouseOver(event: MouseEvent) {
        const current_text = element.getAttribute('aria-label') ?? "";
        if (current_text === "") return;
        text = current_text;

        element.removeAttribute('aria-label');

        div = document.createElement('div');
        div.textContent = text;
        div.className = 'tooltip';
        div.style.left = `${event.pageX + 5}px`;
        div.style.top = `${event.pageY + 5}px`;

        const rect = element.getBoundingClientRect();
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        document.body.appendChild(div);

        const observer = new MutationObserver(() => {
            if (div.parentElement) {
                const tooltipWidth = div.offsetWidth;
                div.style.left = `${rect.left + (rect.width - tooltipWidth) / 2}px`;
                div.style.top = `${rect.bottom + 5}px`;
                div.style.visibility = 'visible';
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function mouseMove(event: MouseEvent) {}

    function mouseLeave() {
        document.body.removeChild(div);
        element.setAttribute('aria-label', text);
    }

    element.addEventListener('mouseover', mouseOver);
    element.addEventListener('mouseleave', mouseLeave);
    // element.addEventListener('mousemove', mouseMove);

    return {
        destroy() {
            element.removeEventListener('mouseover', mouseOver);
            element.removeEventListener('mouseleave', mouseLeave);
            // element.removeEventListener('mousemove', mouseMove);
        }
    }
}
