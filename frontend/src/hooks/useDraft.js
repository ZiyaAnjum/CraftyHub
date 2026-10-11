import { useState, useCallback } from 'react';

const DRAFT_STORAGE_KEY = 'fc_draft_order';

const DEFAULT_DRAFT = {
  selectedItemId: '',
  occasion: '',
  customizationAnswers: {},
  previewOptions: {
    text: '',
    font: 'Playfair Display',
    color: '#C4486A',
    theme: 'floral',
  },
  requirements: '',
  referenceImages: [],
  neededByDate: '',
  phone: '',
  deliveryType: 'delivery',
  address: '',
  lastUpdated: null,
};

export function clearDraftStorage() {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    sessionStorage.removeItem('fc_order_draft');
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    localStorage.removeItem('fc_order_draft');
  } catch {
    // Ignore storage errors
  }
}

export function useDraft() {
  const [draft, setDraftState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(DRAFT_STORAGE_KEY) || localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_DRAFT,
          ...parsed,
          previewOptions: {
            ...DEFAULT_DRAFT.previewOptions,
            ...(parsed.previewOptions || {}),
          },
        };
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
      const serialized = JSON.stringify(updated);
      sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
      localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
    } catch {
      // Ignore storage quota issues
    }
  }, []);

  const updateDraft = useCallback((patch) => {
    setDraftState((prev) => {
      const updated = {
        ...prev,
        ...patch,
        customizationAnswers: {
          ...prev.customizationAnswers,
          ...(patch.customizationAnswers || {}),
        },
        previewOptions: {
          ...prev.previewOptions,
          ...(patch.previewOptions || {}),
        },
        lastUpdated: new Date().toISOString(),
      };
      try {
        const serialized = JSON.stringify(updated);
        sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
        localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
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
