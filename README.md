# Sift — Local document search 

Small Chrome extension + React UI that extracts page text, generates embeddings locally with a WebAssembly transformer, and searches by cosine similarity.

## Features

* **Semantic Search:** Uses vector embeddings to find content based on meaning rather than exact keyword matching.
* **Client-Side AI:** Runs the `@huggingface/transformers` model entirely in the browser using WASM. No data is sent to external servers.
* **DOM Interaction:** Automatically scrolls to and highlights relevant paragraphs or sections within the active tab.

## Key files

* `src/content.ts` — Handles page chunking, DOM scraping, and highlights search results.
* `src/background.ts` — Service worker that loads the pipeline, generates embeddings, and handles vector search.
* `src/App.tsx` — React UI for the popup and search controls.

## Getting started

1. **Install dependencies**
```bash
npm install

```


2. **Start the dev server (UI only)**
```bash
npm run dev

```


3. **Build the extension**
```bash
npm run build

```


4. **Load in Chrome**
Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `build/` directory.

## Notes

* `background.ts` uses a WASM transformer; the model (Xenova/all-MiniLM-L6-v2) may download on first run, which can be slow.
* The project uses Vite; `.css` imports are handled at build time even if TypeScript shows a type warning.