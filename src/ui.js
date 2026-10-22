// Popup rendering. Pure DOM work - no chrome.* calls, no URL logic.
//
// popup.js hands this module a state and nothing else; every word the user
// reads is decided here. It used to be handed a finished sentence and then
// take it apart again with a regular expression, which split the wording
// across two modules and left one branch ignoring its own argument - so
// "(No changes)" had never once reached the screen.

// Two rules hold across every string below, both for readers whose first
// language is not English - which most of them are.
//
// No negative contractions. The whole of "Can't read this tab" turns on one
// apostrophe, and read quickly, in a second language, at 14px, it inverts into
// its own opposite. Positive contractions are fine; these are the four that
// carried a "not".
//
// One word per thing. This said URL in some places and link in others for the
// same string of characters, and tracker here against the store listing's
// tracking parameter. URL won both: it is the product's own name, and it is
// borrowed unchanged into most languages.
const count = (n, noun) => `${n} ${noun}${n === 1 ? '' : 's'}`;

// The box at the top holds what is on the clipboard. A batch therefore shows
// the whole list, not the URL from before it: leaving that up produced
// "Nothing to copy" sitting directly above "Copied 4 links".
//
// null means nothing is on the clipboard, and show() then removes the box.
// It used to put a sentence there instead, which is why "Nothing to copy"
// appeared twice on screen - the box and the message were both being used as
// the message line.
function heading(state) {
    switch (state.kind) {
        // Nothing has been copied yet, so by the rule above there is no box.
        // popup.html starts it hidden as well, so nothing appears and then
        // vanishes, and no word here suggests the URL is being fetched.
        case 'loading':           return null;
        case 'not-shareable':     return null;
        case 'no-tab':            return null;
        case 'invalid-url':       return null;
        case 'batch-empty':       return null;
        // The list, so "copy it from the box above" points at the batch rather
        // than at the single URL left over from opening the popup.
        case 'batch-copied':      return state.text ?? null;
        case 'batch-copy-failed': return state.text ?? null;
        default:                  return state.url ?? null;
    }
}

// The message: a main line, and a second line that is dropped when null.
function lines(state) {
    switch (state.kind) {
        case 'loading':
            return null;
        case 'cleaned':
            // A cleaned URL with nothing counted is reachable: dropping
            // #reviews off an Amazon link changes the URL and removes zero
            // parameters. That printed "0 trackers removed" over a URL the
            // user can see got shorter, so the count is dropped but not the
            // line - the URL still visibly changed. "Shortened" is true of a
            // dropped fragment and of a path cut back to /dp/ alike.
            return ['Copied', state.removed
                ? `${count(state.removed, 'tracking parameter')} removed`
                : 'Shortened'];
        case 'already-clean':
            return ['Copied', 'Already clean'];
        case 'not-shareable':
            return ['Nothing to copy', 'Browser pages cannot be shared'];
        case 'no-tab':
            return ['Cannot read this tab', 'Try reloading the page'];
        case 'invalid-url':
            return ['This URL is not valid', null];
        case 'copy-failed':
        case 'batch-copy-failed':
            return ['Could not copy', 'Copy it from the box above'];
        case 'batch-copied':
            return [`Copied ${count(state.copied, 'URL')}`, batchDetail(state)];
        case 'batch-empty':
            return ['Nothing to copy', 'No open tab has a URL to share'];
        default:
            return ['Something went wrong', 'Please try again'];
    }
}

// Zero terms are left out rather than printed as "0 skipped".
function batchDetail({ skipped = 0, merged = 0 }) {
    const parts = [];
    if (skipped) parts.push(`${count(skipped, 'tab')} skipped`);
    if (merged) parts.push(`${count(merged, 'duplicate')} merged`);
    return parts.length ? parts.join(', ') : null;
}

function tone(kind) {
    switch (kind) {
        case 'cleaned':
        case 'batch-copied':
            return 'success';
        // This one did copy something; it just had nothing to strip.
        case 'already-clean':
            return 'info';
        // Nothing was copied; the clipboard still holds what it held before.
        // Same yellow, no tick.
        case 'not-shareable':
        case 'batch-empty':
            return 'notice';
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
        container.className = 'message-text';

        // The error state used to add a warning sign here on top of the
        // cross the stylesheet already draws, so it showed two marks, and
        // .message-text stacks, so the extra one took its own line. It was
        // U+26A0 U+FE0F - the variation selector forces the colour emoji
        // glyph, which CSS cannot restyle.
        const mainLine = document.createElement('div');
        mainLine.textContent = main;
        container.appendChild(mainLine);

        // The second line used to be faded to 0.9. The difference was not
        // visible, and on the red state it cost 5.76:1 down to 4.91.
        if (sub) {
            const subLine = document.createElement('div');
            subLine.textContent = sub;
            container.appendChild(subLine);
        }

        messageElement.appendChild(container);
    }

    function show(state) {
        const head = heading(state);
        if (head === null || head === undefined) {
            urlDisplayElement.hidden = true;
            urlDisplayElement.textContent = '';
            urlDisplayElement.title = '';
        } else {
            urlDisplayElement.hidden = false;
            // A single long URL is trimmed so it cannot push the popup
            // around. A list is left whole; the box scrolls.
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
