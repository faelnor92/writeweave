// hooks/useAutoSave.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import type { SaveStatus } from '../types.ts';
import { AUTOSAVE_INTERVAL } from '../constants.ts';

interface UseAutoSaveOptions<T> {
  onSave: (data: T) => Promise<boolean> | boolean;
}

export const useAutoSave = <T extends object>(
  data: T,
  options: UseAutoSaveOptions<T>
) => {
  const { onSave } = options;
  const [status, setStatus] = useState<SaveStatus>('idle');
  const isMounted = useRef(true);
  const initialDataRef = useRef(JSON.stringify(data));
  const dataRef = useRef(data);
  dataRef.current = data;

  const handleSave = useCallback(async (isUnloading = false) => {
    // Ne pas sauvegarder si les données n'ont pas changé depuis la dernière sauvegarde
    // sauf si on quitte la page.
    if (!isUnloading && JSON.stringify(dataRef.current) === initialDataRef.current) {
      return;
    }

    if (!isMounted.current && !isUnloading) return;
    setStatus('saving');

    try {
      const success = await Promise.resolve(onSave(dataRef.current));
      if (isMounted.current) {
        if (success) {
          setStatus('success');
          initialDataRef.current = JSON.stringify(dataRef.current);
          setTimeout(() => {
            if (isMounted.current) {
              setStatus('idle');
            }
          }, 1500);
        } else {
          setStatus('error');
        }
      }
    } catch (error) {
      console.error("Erreur d'auto-sauvegarde:", error);
      if (isMounted.current) {
        setStatus('error');
      }
    }
  }, [onSave]);

  const manualSave = useCallback(() => {
    return handleSave(false);
  }, [handleSave]);

  useEffect(() => {
    isMounted.current = true;
    
    // Configurer la sauvegarde à intervalle régulier
    const interval = setInterval(() => {
      handleSave();
    }, AUTOSAVE_INTERVAL);

    // Configurer la sauvegarde avant de quitter
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(dataRef.current) !== initialDataRef.current) {
        handleSave(true);
        // Bien que la sauvegarde soit asynchrone, la plupart des navigateurs ne le garantissent pas.
        // On ne met pas de `preventDefault` pour ne pas bloquer l'utilisateur.
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleSave]);

  return { status, manualSave };
};