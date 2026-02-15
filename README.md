# Sift — Local document search (experimental)

    Small Chrome extension + React UI that extracts page text, generates embeddings locally with a WebAssembly transformer, and searches by cosine similarity.

    # Sift — Local document search (experimental)

    Small Chrome extension + React UI that extracts page text, generates embeddings locally with a WebAssembly transformer, and searches by cosine similarity.

    ## Key files

    - `src/content.ts` — page chunking and messaging to the background worker
    - `src/background.ts` — service worker that generates and stores embeddings
    - `src/App.tsx` — React UI

    ## Getting started

    1. Install dependencies

    ```bash
    npm install
    ```

    2. Start the dev server (UI only)

    ```bash
    npm run dev
    ```

    3. Build the extension

    ```bash
    npm run build
    ```

    4. Load in Chrome

    Open `chrome://extensions`, enable Developer mode, click **Load unpacked**, and select the `build/` directory.

    ## Notes

    - `background.ts` uses a WASM transformer; the model may download on first run, which can be slow.
    - The project uses Vite; `.css` imports are handled at build time even if TypeScript shows a type warning.

    If you want this README shorter or to include screenshots/badges, tell me what to add.
