import { pipeline } from '@huggingface/transformers';
import type { EmbeddedChunk } from './types';

let cachedPipe : any = null;

async function getPipeline() {
    if (!cachedPipe) {
        cachedPipe = await pipeline('feature-extraction'); // defaults to 'Xenova/all-MiniLM-L6-v2';
    }
    return cachedPipe;
}

async function generateEmbeddings(chunkedText: Map<string, string>) : Promise<EmbeddedChunk[]> {
    const pipe = await getPipeline();
    const embeddingList : EmbeddedChunk[] = [];
    for (const [id, text] of chunkedText) {
        const out = await pipe(text, { pooling: 'mean', normalize: true });
        embeddingList.push({nodeId : id, text : text, embedding : Array.from(out.data)});
    }

    return embeddingList;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function searchEmbeddings(query : string, tabId : number) : Promise<EmbeddedChunk[]> {
    const result : any = await chrome.storage.session.get(tabId.toString());
    const chunks: EmbeddedChunk[] = result[tabId.toString()];
    if (!chunks) return [];

    const pipe = await getPipeline();
    const queryEmbedding = await pipe(query, { pooling: 'mean', normalize: true });
    const queryArray : number[] = Array.from(queryEmbedding.data);

    return chunks
    .map(chunk => ({ chunk, score: cosineSimilarity(queryArray, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ chunk }) => chunk);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Ignore messages that are not meant for embedding generation
    if (message.type !== 'GENERATE_EMBEDDINGS') return; 

    console.log("Received message: generate", message.type);

    const tabId = sender.tab?.id;
    if (!tabId) return;

    (async () => {
        const embeddings : EmbeddedChunk[] = await generateEmbeddings(new Map(Object.entries(message.data)));
        chrome.storage.session.set({[tabId.toString()]: embeddings});
        sendResponse({ status: "done" });
    })();

    return true;
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // Ignore messages that are not meant for embedding search
    if (message.type !== 'SEARCH_EMBEDDINGS') return; 

    console.log("Received message: search", message.type);

    (async () => {
       const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
       if (!tab.id) return;
       const result : EmbeddedChunk[] = await searchEmbeddings(message.data, tab.id);
       sendResponse(result);
     })();

    // return true to indicate we will send a response asynchronously
    // see https://stackoverflow.com/a/46628145 for more information
    return true;
});

chrome.tabs.onRemoved.addListener((tabId, _removeInfo) => {
  chrome.storage.session.remove(tabId.toString());
});