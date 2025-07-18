// hooks/useLexicalDiversity.ts
import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce.ts';
import type { LexicalDiversity } from '../types.ts';

const calculateLexicalDiversity = (text: string): { score: number; rating: LexicalDiversity['rating'] } => {
  if (!text.trim()) {
    return { score: 0, rating: 'Faible' };
  }

  // Nettoyage et tokenisation
  const words = text
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ') // Supprimer les balises HTML
    .match(/\b\w+\b/g) || []; // Ne garder que les mots

  if (words.length < 25) { // Pas assez de texte pour une analyse pertinente
    return { score: 0, rating: 'Faible' };
  }

  const uniqueWords = new Set(words);
  // Utilisation de l'indice de Guiraud (TTR Racine) qui est moins sensible à la longueur du texte
  const score = uniqueWords.size / Math.sqrt(words.length);

  let rating: LexicalDiversity['rating'];
  if (score > 25) { // Les seuils sont ajustés pour l'indice de Guiraud
    rating = 'Élevée';
  } else if (score > 15) {
    rating = 'Moyenne';
  } else {
    rating = 'Faible';
  }

  return { score, rating };
};

export const useLexicalDiversity = (text: string): LexicalDiversity | null => {
  const [diversity, setDiversity] = useState<LexicalDiversity | null>(null);
  const debouncedText = useDebounce(text, 1500); // Débounce de 1.5s

  useEffect(() => {
    const result = calculateLexicalDiversity(debouncedText);
    setDiversity(result);
  }, [debouncedText]);

  return diversity;
};