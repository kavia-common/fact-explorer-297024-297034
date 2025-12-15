import React, { useCallback, useEffect, useMemo, useState } from "react";

// PUBLIC_INTERFACE
export function getBackendBaseUrl() {
  /** Returns the backend base URL for API calls.
   * Uses window.location to infer host and forces port 3001.
   * Example: if frontend runs on http://localhost:3000, backend will be http://localhost:3001
   */
  try {
    const { protocol, hostname } = window.location;
    const base = `${protocol}//${hostname}:3001`;
    return base;
  } catch {
    return "http://localhost:3001";
  }
}

const api = {
  async randomFact() {
    const res = await fetch(`${getBackendBaseUrl()}/facts/random`);
    if (!res.ok) throw new Error("Failed to fetch random fact");
    return res.json();
  },
  async listFavorites(userId = "default") {
    const res = await fetch(`${getBackendBaseUrl()}/facts/favorites?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error("Failed to fetch favorites");
    return res.json();
  },
  async addFavorite(text, userId = "default") {
    const res = await fetch(`${getBackendBaseUrl()}/facts/favorites?userId=${encodeURIComponent(userId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error("Failed to add favorite");
    return res.json();
  },
  async removeFavorite(text, userId = "default") {
    const url = `${getBackendBaseUrl()}/facts/favorites?userId=${encodeURIComponent(userId)}&text=${encodeURIComponent(text)}`;
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to remove favorite");
    return res.json();
  }
};

function Sparkles() {
  return (
    <div className="logo" aria-hidden="true" />
  );
}

function useAsync(asyncFn, deps) {
  const [state, setState] = useState({ loading: false, error: null, data: null });
  const memoFn = useCallback(async (...args) => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await asyncFn(...args);
      setState({ loading: false, error: null, data });
      return data;
    } catch (e) {
      setState({ loading: false, error: e, data: null });
      throw e;
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return [state, memoFn];
}

export default function App() {
  const [currentFact, setCurrentFact] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const [randomState, loadRandom] = useAsync(api.randomFact, []);
  const [favListState, loadFavs] = useAsync(api.listFavorites, []);
  const [addingState, addFav] = useAsync(api.addFavorite, []);
  const [removingState, removeFav] = useAsync(api.removeFavorite, []);

  const loading = randomState.loading || favListState.loading || addingState.loading || removingState.loading;

  const isFavorite = useMemo(() => {
    return !!currentFact && favorites.some(f => f.text === currentFact.text);
  }, [currentFact, favorites]);

  const refreshFact = useCallback(async () => {
    setErrorMsg("");
    try {
      const fact = await loadRandom();
      setCurrentFact(fact);
    } catch (e) {
      setErrorMsg(e.message || "Failed to load random fact");
    }
  }, [loadRandom]);

  const refreshFavorites = useCallback(async () => {
    setErrorMsg("");
    try {
      const favs = await loadFavs("default");
      setFavorites(favs);
    } catch (e) {
      setErrorMsg(e.message || "Failed to load favorites");
    }
  }, [loadFavs]);

  const onToggleFavorite = useCallback(async () => {
    if (!currentFact) return;
    setErrorMsg("");
    try {
      if (favorites.some(f => f.text === currentFact.text)) {
        await removeFav(currentFact.text, "default");
      } else {
        await addFav(currentFact.text, "default");
      }
      await refreshFavorites();
    } catch (e) {
      setErrorMsg(e.message || "Favorite action failed");
    }
  }, [currentFact, favorites, addFav, removeFav, refreshFavorites]);

  const onRemoveFavoriteItem = useCallback(async (text) => {
    setErrorMsg("");
    try {
      await removeFav(text, "default");
      await refreshFavorites();
    } catch (e) {
      setErrorMsg(e.message || "Failed to remove favorite");
    }
  }, [removeFav, refreshFavorites]);

  useEffect(() => {
    refreshFact();
    refreshFavorites();
  }, []); // mount

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div className="brand">
            <Sparkles />
            <div>
              <h1 className="title">Fact Explorer</h1>
              <p className="subtitle">Rainbow Burst Edition</p>
            </div>
          </div>
          <span className="badge">Beta</span>
        </div>

        {errorMsg ? (
          <div className="fact" role="alert" style={{ borderColor: "rgba(239,68,68,.5)", background: "rgba(239,68,68,.08)" }}>
            {errorMsg}
          </div>
        ) : (
          <div className="fact" aria-live="polite">
            {currentFact ? currentFact.text : "Loading a curious fact..."}
          </div>
        )}

        <div className="actions">
          <button className="btn btn-primary" onClick={refreshFact} disabled={loading}>
            🔄 New Fact
          </button>
          <button
            className={`btn ${isFavorite ? "btn-danger" : "btn-success"}`}
            onClick={onToggleFavorite}
            disabled={loading || !currentFact}
          >
            {isFavorite ? "💔 Remove Favorite" : "💖 Save Favorite"}
          </button>
          <a className="link" href="#favorites">Jump to Favorites ↓</a>
        </div>

        <div id="favorites" className="favorites" aria-label="Favorites list">
          <h3>Favorites</h3>
          {favorites.length === 0 ? (
            <p style={{ opacity: .85 }}>No favorites yet. Save some facts you like!</p>
          ) : (
            favorites.map((f) => (
              <div key={f.text} className="favorite-item">
                <span>{f.text}</span>
                <button className="btn btn-secondary" onClick={() => onRemoveFavoriteItem(f.text)} disabled={loading}>
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 12, opacity: .8, fontSize: 12 }}>
          Backend: {getBackendBaseUrl()}
        </div>
      </div>
    </div>
  );
}
