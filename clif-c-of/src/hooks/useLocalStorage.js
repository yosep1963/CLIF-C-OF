import { useState, useEffect } from 'react';

const STORAGE_KEY = 'clif-c-of-history';
const MAX_HISTORY = 10;

export function useLocalStorage(key = STORAGE_KEY, initialValue = []) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

export function useDiagnosisHistory() {
  const [history, setHistory] = useLocalStorage(STORAGE_KEY, []);

  const addToHistory = (diagnosis) => {
    setHistory((prev) => {
      const newHistory = [
        {
          ...diagnosis,
          id: Date.now(),
          timestamp: new Date().toISOString()
        },
        ...prev
      ].slice(0, MAX_HISTORY);
      return newHistory;
    });
  };

  const removeFromHistory = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const loadFromHistory = (id) => {
    return history.find((item) => item.id === id);
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    loadFromHistory
  };
}
