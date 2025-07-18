import React, { useEffect, useCallback } from 'react';
import type { Image } from '../types.ts';
import XIcon from './icons/XIcon.tsx';
import TrashIcon from './icons/TrashIcon.tsx';
import EyeIcon from './icons/EyeIcon.tsx';

interface ImagePopupProps {
  image: Image;
  onClose: () => void;
  onOpenInWindow: () => void;
  onDelete: () => void;
}

const ImagePopup: React.FC<ImagePopupProps> = ({ 
  image, 
  onClose, 
  onOpenInWindow, 
  onDelete 
}) => {
  // Fermer avec Échap
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = image.base64;
    link.download = image.name;
    link.click();
  };

  const copyImageToClipboard = async () => {
    try {
      // Convertir base64 en blob
      const response = await fetch(image.base64);
      const blob = await response.blob();
      
      // Copier dans le presse-papier si supporté
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        
        // Feedback visuel
        const button = document.getElementById('copy-button');
        if (button) {
          button.textContent = 'Copiée !';
          setTimeout(() => {
            button.textContent = 'Copier';
          }, 2000);
        }
      } else {
        // Fallback - télécharger l'image
        downloadImage();
      }
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      // Fallback - télécharger l'image
      downloadImage();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-title"
    >
      <div className="relative max-w-7xl max-h-full w-full">
        {/* Barre d'outils */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm rounded-t-lg">
          <div className="flex justify-between items-center p-4">
            <h2 
              id="image-title" 
              className="text-white font-medium truncate mr-4"
              title={image.name}
            >
              {image.name}
            </h2>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={copyImageToClipboard}
                id="copy-button"
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-md text-sm transition-colors"
                title="Copier l'image"
              >
                Copier
              </button>
              
              <button
                onClick={downloadImage}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-md text-sm transition-colors"
                title="Télécharger l'image"
              >
                ⬇ Télécharger
              </button>
              
              <button
                onClick={onOpenInWindow}
                className="bg-blue-600/80 hover:bg-blue-600 text-white p-2 rounded-md transition-colors"
                title="Ouvrir dans une nouvelle fenêtre"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15,3 21,3 21,9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
              
              <button
                onClick={onDelete}
                className="bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-md transition-colors"
                title="Supprimer l'image"
              >
                <TrashIcon />
              </button>
              
              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-md transition-colors"
                title="Fermer (Échap)"
              >
                <XIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Image principale */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
          <div className="pt-16"> {/* Espace pour la barre d'outils */}
            <img
              src={image.base64}
              alt={image.name}
              className="w-full h-auto max-h-[80vh] object-contain"
              style={{ maxHeight: 'calc(100vh - 8rem)' }}
            />
          </div>
        </div>

        {/* Info en bas */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm text-white p-4 rounded-b-lg">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-4">
              <span>Cliquez et faites glisser pour déplacer</span>
              <span>•</span>
              <span>Échap pour fermer</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-300">
              <span>Image de référence</span>
            </div>
          </div>
        </div>

        {/* Zone cliquable pour fermer */}
        <div 
          className="absolute inset-0 -z-10"
          onClick={onClose}
          title="Cliquer pour fermer"
        />
      </div>
    </div>
  );
};

export default ImagePopup;