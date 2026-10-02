import { useState, useEffect, useCallback } from 'react';

const DRAFT_STORAGE_KEY = 'fc_draft_order';

const DEFAULT_DRAFT = {
  occasion: 'Birthday',
  budget: 2000,
  recipient: '',
  items: [{ name: 'Customized Gift Box', qty: 1 }],
  customization: {
    text: 'Happy Birthday!',
    font: 'Elegant Serif',
    colour: 'Blush & Gold',
    theme: 'Floral Romance',
    notes: '',
  },
  preferredDate: '',
  lastUpdated: null,
};

export function clearDraftStorage() {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function useDraft() {
  const [draft, setDraftState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_DRAFT, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback on storage errors
    }
    return DEFAULT_DRAFT;
  });

  const saveDraft = useCallback((data) => {
    const updated = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    setDraftState(updated);
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore sessionStorage quota issues
    }
  }, []);

  const updateDraft = useCallback((patch) => {
    setDraftState((prev) => {
      const updated = {
        ...prev,
        ...patch,
        customization: {
          ...prev.customization,
          ...(patch.customization || {}),
        },
        lastUpdated: new Date().toISOString(),
      };
      try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore errors
      }
      return updated;
    });
  }, []);

  const clearDraft = useCallback(() => {
    setDraftState(DEFAULT_DRAFT);
    clearDraftStorage();
  }, []);

  return {
    draft,
    saveDraft,
    updateDraft,
    clearDraft,
  };
}
