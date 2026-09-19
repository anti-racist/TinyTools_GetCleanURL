// Popup rendering. Pure DOM work - no chrome.* calls, no URL logic.
//
// popup.js hands this module a state and nothing else; every word the user
// reads is decided here. It used to be handed a finished sentence and then
// take it apart again with a regular expression, which split the wording
// across two modules and left one branch ignoring its own argument - so
// "(No changes)" had never once reached the screen.

const count = (n, noun) => `${n} ${noun}${n === 1 ? '' : 's'}`;

// The box at the top says what is on the clipboard now - which is what it has
// always said, since v1.4 put the cleaned URL there. So a batch shows the
// whole list: leaving the previous line up produced "Nothing to copy" sitting
// directly above "Copied 4 links". The box scrolls, and a list you can read
// back is worth more than a promise that it worked.
function heading(state) {
    switch (state.kind) {
        case 'loading':       return 'Getting URL...';
        case 'not-shareable': return 'Nothing to copy';
        case 'no-tab':        return 'No URL available';
        case 'invalid-url':   return 'Invalid URL';
        case 'batch-copied':  return state.text ?? null;
        case 'batch-empty':   return 'Nothing to copy';
        default:              return state.url ?? null;   // null: leave it alone
    }
}

// The message: a main line, and a second line that is dropped when null.
function lines(state) {
    switch (state.kind) {
        case 'loading':
            return null;
        case 'cleaned':
            return ['Copied', `${count(state.removed, 'tracker')} removed`];
        case 'already-clean':
            return ['Copied', 'Already clean'];
        case 'not-shareable':
            return ['Nothing to copy', "Browser pages can't be shared"];
        case 'no-tab':
            return ["Can't read this tab", 'Try reloading the page'];
        case 'invalid-url':
            return ["This URL isn't valid", null];
        case 'copy-failed':
        case 'batch-copy-failed':
            return ["Couldn't copy", 'Check clipboard permissions'];
        case 'batch-copied':
            return [`Copied ${count(state.copied, 'link')}`, batchDetail(state)];
        case 'batch-empty':
            return ['Nothing to copy', 'No open tab has a link to share'];
        default:
            return ['Something went wrong', 'Please try again'];
    }
}

// Zero terms are left out rather than printed as "0 skipped".
function batchDetail({ skipped = 0, merged = 0 }) {
    const parts = [];
    if (skipped) parts.push(`${skipped} skipped`);
    if (merged) parts.push(`${count(merged, 'duplicate')} merged`);
    return parts.length ? parts.join(' · ') : null;
}

function tone(kind) {
    switch (kind) {
        case 'cleaned':
        case 'batch-copied':
            return 'success';
        case 'already-clean':
        case 'not-shareable':
        case 'batch-empty':
            return 'info';
        case 'loading':
            return '';
        default:
            return 'error';
    }
}

export function createRenderer(urlDisplayElement, messageElement) {
    function paint(main, sub, className) {
        messageElement.innerHTML = '';
        messageElement.className = className;

        const container = document.createElement('div');
        container.className = className === 'error' ? 'message-text error-message' : 'message-text';

        // The error shape keeps its own icon span, as it has since v1.4.
        if (className === 'error') {
            const icon = document.createElement('span');
            icon.textContent = '⚠️';
            icon.className = 'error-icon';
            container.appendChild(icon);
        }

        const mainLine = document.createElement(className === 'error' ? 'span' : 'div');
        mainLine.textContent = main;
        container.appendChild(mainLine);

        if (sub) {
            const subLine = document.createElement('div');
            subLine.textContent = sub;
            subLine.style.opacity = '0.9';
            container.appendChild(subLine);
        }

        messageElement.appendChild(container);
    }

    function show(state) {
        const head = heading(state);
        if (head !== null && head !== undefined) {
            // A single long URL is trimmed so it cannot push the popup around;
            // a list is left whole, because the box scrolls and the point of
            // showing it is that every line can be read back.
            const multiline = head.includes('\n');
            urlDisplayElement.textContent =
                (!multiline && head.length > 300) ? head.substring(0, 297) + '...' : head;
            urlDisplayElement.title = head;
        }

        const text = lines(state);
        if (text === null) {
            messageElement.innerHTML = '';
            messageElement.className = '';
            return;
        }
        paint(text[0], text[1], tone(state.kind));
    }

    return { show };
}
