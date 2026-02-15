# Sift

A Chrome extension that brings semantic search to any webpage. Instead of matching exact keywords like Ctrl+F, Sift understands the *meaning* of your query and finds the most relevant passages on the page.

## How It Works

When you visit a page, Sift's content script breaks the page into text chunks and sends them to a background service worker. The service worker runs the [all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2) sentence transformer model locally via [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js) to generate embeddings for each chunk. When you search, your query is embedded and compared against the stored chunks using cosine similarity, returning the top 3 matches.

Matched chunks are highlighted on the page and you can navigate between them using the arrow buttons in the popup.

## Usage Tips

Sift works best when your queries are phrased as **natural language questions or longer statements** rather than short keywords. For example:

- "What were the main causes of the conflict?" works better than "causes"
- "How does photosynthesis produce energy?" works better than "photosynthesis energy"

This is because the underlying model is trained on sentence-level similarity, so it understands full questions better than keyword fragments.

## Performance

Embedding generation runs locally in-browser using WASM, so it can take some time on large pages. Small articles process in a few seconds; very long pages (like detailed Wikipedia articles) may take longer. The model only needs to load once per session — subsequent pages will be faster.

## Setup

### Prerequisites

- Node.js
- npm

### Install

```bash
git clone <repo-url>
cd sift
npm install
```

### Build

```bash
npm run build
```

### Load in Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `build` folder

## Architecture

| File | Role |
|------|------|
| `content.ts` | Chunks the page DOM into text blocks, tags elements with `data-chunk-id`, handles highlighting |
| `background.ts` | Service worker that stores embeddings, runs cosine similarity search, relays messages |
| `App.tsx` | Popup UI with search input and navigation controls |
| `types.ts` | Shared `EmbeddedChunk` interface |

## Tech Stack

- React + TypeScript
- Vite
- Hugging Face Transformers.js (all-MiniLM-L6-v2)
- Chrome Extensions Manifest V3