import { useState, useRef, useEffect } from 'react'
import type { EmbeddedChunk } from './types';
import './App.css'

function App() {
  const [queryResult, setQueryResult] = useState<EmbeddedChunk[]>([]);
  const lastQuery = useRef<string>("");
  const requestId = useRef(0);

  // send to model
  const handleSearch = async (searchQuery : string) => {
    const trimmed = searchQuery.trim();
    if (trimmed.length === 0 || trimmed === lastQuery.current) return;

    const currentId = ++requestId.current;
    const message = {
      type: "SEARCH_EMBEDDINGS",
      data: trimmed
    };

    // try twice beacuse background service worker could be inactive
    for (let i = 0; i < 2; i++) {
      try {
        const result = await chrome.runtime.sendMessage(message);
        if (requestId.current === currentId) {
          lastQuery.current = trimmed;
          setQueryResult(result);
        }
        return;
      } 
      catch (error) {
        if (i === 1) {
          console.error("Search failed after retries:", error);
          lastQuery.current = "";
        }
      }
    }
  }

  return (
    <div className="search-container">  
      <TextField onSearch = {handleSearch}/>
      <SearchControls chunks = {queryResult}/>
    </div>
  )
}

interface TextFieldProps {
  onSearch: (value: string) => void; 
}

function TextField({onSearch} : TextFieldProps) {
  const [draft, setDraft] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(draft);
    }
  };

  return (
    <input
      type="search"
      value = {draft}
      onChange = {(e) => setDraft(e.target.value)} // whenever the text is changed
      onKeyDown={handleKeyDown} // wait for enter key
      className="search-input"
    />
  );
}

interface SearchControlsProps {
  chunks: EmbeddedChunk[];
}

function SearchControls({ chunks }: SearchControlsProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(1);

  const highlightChunk = async (index: number) => {
    if (chunks.length === 0) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;

    const message = {
      type: "HIGHLIGHT_CHUNK",
      data: chunks[index - 1],
    };
    chrome.tabs.sendMessage(tab.id, message);
  };

  const handlePrev = () => {
    const newIndex = currentIndex === 1 ? chunks.length : currentIndex - 1;
    setCurrentIndex(newIndex);
    highlightChunk(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex === chunks.length ? 1 : currentIndex + 1;
    setCurrentIndex(newIndex);
    highlightChunk(newIndex);
  };

  useEffect(() => {
    setCurrentIndex(1);
    if (chunks.length > 0) highlightChunk(1);
  }, [chunks]);

  return (
    <div className="button-group">
      <span className="match-count">
        {chunks.length > 0 ? `${currentIndex} / ${chunks.length}` : "0 / 0"}
      </span>
      <button className="arrow-btn" onClick={handlePrev}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
      <button className="arrow-btn" onClick={handleNext}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}

export default App