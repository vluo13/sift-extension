console.log("Content script loaded");


function chunk(root: Node): Map<string, string> {
    // by defining idCounter here instead of a global, it gets reset
    // to zero each time 
    let idCounter : number = 0;

    function walk(node: Node): Map<string, string> {
        const idToText: Map<string, string> = new Map();
        const walker: TreeWalker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
        
        let child = walker.firstChild() as HTMLElement | null;

        while (child) {
            let wasChunked : boolean = false;

            if (child instanceof HTMLParagraphElement || child instanceof HTMLOListElement || child instanceof HTMLUListElement) {
                const id : string = (idCounter++).toString();
                child.dataset.chunkId = id;
                
                // in case the text is null
                const text : string = child.textContent?.trim() || "";
                if (text) idToText.set(id, text);
                
                wasChunked = true; 
            }
            else if (child instanceof HTMLDivElement) {
                // some passes three args to the callback but there is parameter omission so the rest are discarded
                const hasDirectText : boolean = Array.from(child.childNodes)
                    .some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());

                if (hasDirectText) {
                    const id = (idCounter++).toString();
                    child.dataset.chunkId = id;
                    const text = child.textContent?.trim() || "";
                    if (text) idToText.set(id, text);
                    wasChunked = true;
                }
            }

            // if we added the text, stop here
            if (!wasChunked) {
                const res : Map<string, string> = walk(child);
                res.forEach((value, key) => idToText.set(key, value));
            }

            child = walker.nextSibling() as HTMLElement | null;
        }

        return idToText;
    }

    return walk(root);
}

// wait to call this until the DOM is fully loaded
const chunkedText: Map<string, string> = chunk(document.body);

// send to extension service worker

async function sendChunks() {
    console.log("Sending chunks:", chunkedText.size);
    const message = {
        type: "GENERATE_EMBEDDINGS",
        data: Object.fromEntries(chunkedText)
    };

    try {
        // Await the promise returned by sendMessage()
        const response = await chrome.runtime.sendMessage(message);
        console.log("Embedding generation completed:", response.status);
    } catch (error) {
        console.error("Embedding generation failed:", error);
    }
}

sendChunks();

// Highlighting

let currentHighlight: HTMLElement | null = null;

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "HIGHLIGHT_CHUNK") {
        console.log("Received message: highlight", message.type);
        if (currentHighlight) {
            currentHighlight.classList.remove("semantic-highlight");
        }

        const elem = document.querySelector(`[data-chunk-id="${message.data.nodeId}"]`) as HTMLElement | null;

        if (elem) {
            elem.classList.add("semantic-highlight");
            elem.scrollIntoView({ behavior: "smooth", block: "center" });
            currentHighlight = elem;
        }
    }
});

// inject highlight style
const style = document.createElement("style");
style.textContent = `.semantic-highlight { background-color: #ffeb3b80; }`;
document.head.appendChild(style);