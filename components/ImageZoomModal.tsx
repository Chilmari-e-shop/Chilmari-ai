import React, { useEffect } from 'react';
import { XIcon, DownloadIcon } from './Icons';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ isOpen, onClose, imageUrl }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const handleDownload = (e: React.MouseEvent) => {
    // Prevent modal from closing when download button is clicked
    e.stopPropagation(); 
    const link = document.createElement('a');
    link.href = imageUrl;
    const fileExtension = imageUrl.split(';')[0].split('/')[1] || 'png';
    link.download = `chilmari-ai-image.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] p-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
      >
        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
          <button 
            onClick={handleDownload} 
            className="bg-white text-black rounded-full p-1.5 hover:bg-gray-200 transition-colors"
            title="Download image"
          >
            <DownloadIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={onClose} 
            className="bg-white text-black rounded-full p-1.5 hover:bg-gray-200 transition-colors"
            title="Close"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <img src={imageUrl} alt="Zoomed" className="w-full h-full object-contain rounded-lg" />
      </div>
    </div>
  );
};

export default ImageZoomModal;
