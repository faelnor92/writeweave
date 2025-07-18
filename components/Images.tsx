// components/Images.tsx
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Image } from '../types.ts';
import FileUpIcon from './icons/FileUpIcon.tsx';
import TrashIcon from './icons/TrashIcon.tsx';
import EyeIcon from './icons/EyeIcon.tsx';
import XIcon from './icons/XIcon.tsx';
import Spinner from './common/Spinner.tsx';
import ImagePopup from './ImagePopup.tsx';
import { useToast } from '../hooks/useToast.ts';


interface ImagesProps {
  images: Image[];
  setImages: (updater: (prev: Image[]) => Image[]) => void;
}

const Images: React.FC<ImagesProps> = ({ images, setImages }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    visible: boolean;
    imageId: string;
    imageName: string;
  }>({
    visible: false,
    imageId: '',
    imageName: ''
  });
  const { addToast } = useToast();


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const file = files[0];

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('L\'image est trop volumineuse. Taille maximale : 5MB', 'error');
      setIsUploading(false);
      return;
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      addToast('Veuillez sélectionner un fichier image valide.', 'error');
      setIsUploading(false);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const newImage: Image = {
        id: uuidv4(),
        name: file.name,
        base64: reader.result as string,
      };
      setImages(prev => [newImage, ...prev]);
      setIsUploading(false);
      addToast(`"${file.name}" ajoutée avec succès.`, 'success');
    };

    reader.onerror = () => {
      addToast('Erreur lors de la lecture de l\'image.', 'error');
      console.error('FileReader error for image upload.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
    
    // Reset input pour permettre de re-sélectionner le même fichier
    event.target.value = '';
  };

  const handleDeleteClick = (e: React.MouseEvent, image: Image) => {
    e.stopPropagation();
    setDeleteConfirmation({
      visible: true,
      imageId: image.id,
      imageName: image.name
    });
  };

  const confirmDelete = () => {
    setImages(prev => prev.filter(img => img.id !== deleteConfirmation.imageId));
    addToast(`"${deleteConfirmation.imageName}" a été supprimée.`, 'info');
    setDeleteConfirmation({ visible: false, imageId: '', imageName: '' });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ visible: false, imageId: '', imageName: '' });
  };

  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
  };

  const openImageInNewWindow = (image: Image) => {
    const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${image.name}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                background: #000;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              }
              .container {
                text-align: center;
                max-width: 100%;
                max-height: 100%;
              }
              img {
                max-width: 100%;
                max-height: 80vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.8);
              }
              .title {
                color: white;
                margin-top: 20px;
                font-size: 18px;
                font-weight: 500;
              }
              .info {
                color: #888;
                margin-top: 10px;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="${image.base64}" alt="${image.name}" />
              <div class="title">${image.name}</div>
              <div class="info">Image de référence • Cliquez sur l'image pour la télécharger</div>
            </div>
            <script>
              document.querySelector('img').addEventListener('click', function() {
                const link = document.createElement('a');
                link.href = '${image.base64}';
                link.download = '${image.name}';
                link.click();
              });
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <div className="p-4 md:p-8 text-gray-800 dark:text-gray-300 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Images & Inspiration</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez vos images de référence pour l'inspiration lors de l'écriture
          </p>
        </div>
        
        <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-md transition-colors cursor-pointer disabled:opacity-50">
          {isUploading ? <Spinner className="w-5 h-5" /> : <FileUpIcon />}
          <span>{isUploading ? 'Upload...' : 'Ajouter une image'}</span>
          <input
            type="file"
            className="hidden"
            accept="image/png, image/jpeg, image/gif, image/webp"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Informations d'aide */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Comment utiliser vos images</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• <strong>Clic simple</strong> : Aperçu en grand dans un modal</li>
          <li>• <strong>Bouton œil</strong> : Ouvrir dans une nouvelle fenêtre (gardez-la en arrière-plan pendant l'écriture)</li>
          <li>• <strong>Bouton corbeille</strong> : Supprimer l'image</li>
          <li>• Formats supportés : PNG, JPEG, GIF, WebP (max 5MB)</li>
        </ul>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map(image => (
            <div key={image.id} className="group relative bg-white dark:bg-gray-800/70 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200">
              {/* Image */}
              <div 
                className="relative cursor-pointer overflow-hidden"
                onClick={() => handleImageClick(image)}
              >
                <img 
                  src={image.base64} 
                  alt={image.name} 
                  className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105" 
                />
                
                {/* Overlay avec actions au hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(image);
                    }}
                    className="bg-white/20 hover:bg-white/30 p-3 rounded-full text-white transition-colors"
                    title="Voir en grand"
                  >
                    <EyeIcon />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openImageInNewWindow(image);
                    }}
                    className="bg-blue-600/80 hover:bg-blue-500 p-3 rounded-full text-white transition-colors"
                    title="Ouvrir dans une nouvelle fenêtre"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15,3 21,3 21,9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={(e) => handleDeleteClick(e, image)}
                    className="bg-red-600/80 hover:bg-red-500 p-3 rounded-full text-white transition-colors"
                    title="Supprimer l'image"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {/* Nom de l'image */}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={image.name}>
                  {image.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cliquez pour agrandir
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-8 bg-white dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m0 0l-6 6m6-6v18" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune image</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Ajoutez des images pour créer votre moodboard d'inspiration.
            </p>
            <label className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer">
              <FileUpIcon />
              Choisir une image
              <input
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/gif, image/webp"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      )}

      {/* Modal d'aperçu */}
      {selectedImage && (
        <ImagePopup 
          image={selectedImage} 
          onClose={() => setSelectedImage(null)}
          onOpenInWindow={() => {
            openImageInNewWindow(selectedImage);
            setSelectedImage(null);
          }}
          onDelete={() => {
            setDeleteConfirmation({
              visible: true,
              imageId: selectedImage.id,
              imageName: selectedImage.name
            });
            setSelectedImage(null);
          }}
        />
      )}

      {/* Modal de confirmation de suppression */}
      {deleteConfirmation.visible && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Supprimer l'image</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer l'image <strong>"{deleteConfirmation.imageName}"</strong> ?
              <br />
              <span className="text-red-500 dark:text-red-400 text-sm">Cette action est irréversible.</span>
            </p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={cancelDelete}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-md transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Images;