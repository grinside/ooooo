import { useState, useEffect } from 'react';

const useLocalStorage = (key, initialValue) => {
  // Get initial value from localStorage or use initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when storedValue changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Return a wrapped version of useState's setter function
  const setValue = (value) => {
    try {
      // Allow value to be a function (same API as useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Remove from localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
