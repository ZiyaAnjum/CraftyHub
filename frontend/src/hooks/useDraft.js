import { useState, useCallback } from 'react';

const DRAFT_STORAGE_KEY = 'fc_draft_order';

const DEFAULT_DRAFT = {
  selectedItemId: '',
  customizationAnswers: {},
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
        customizationAnswers: {
          ...prev.customizationAnswers,
          ...(patch.customizationAnswers || {}),
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
