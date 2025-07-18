import { useState, useCallback, useEffect } from 'react';

interface FocusModeOptions {
  hideUI?: boolean;
  centerText?: boolean;
}

export const useFocusMode = (options: FocusModeOptions = {}) => {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const applyClasses = useCallback(() => {
    if (options.hideUI) document.body.classList.add('focus-hide-ui');
    if (options.centerText) document.body.classList.add('focus-center-text');
  }, [options.hideUI, options.centerText]);

  const removeClasses = useCallback(() => {
    document.body.classList.remove('focus-hide-ui', 'focus-center-text');
  }, []);

  const enterFocusMode = useCallback(() => {
    setIsFocusMode(true);
    applyClasses();
  }, [applyClasses]);

  const exitFocusMode = useCallback(() => {
    setIsFocusMode(false);
    removeClasses();
  }, [removeClasses]);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => {
      const nextIsFocusMode = !prev;
      if (nextIsFocusMode) {
        applyClasses();
      } else {
        removeClasses();
      }
      return nextIsFocusMode;
    });
  }, [applyClasses, removeClasses]);

  useEffect(() => {
    // Cleanup on unmount
    return () => removeClasses();
  }, [removeClasses]);

  return { isFocusMode, toggleFocusMode, exitFocusMode };
};
