import React, { useState } from 'react';
import Masonry from 'react-masonry-css';
import { Download, XSquare } from 'lucide-react';
import api from '../services/api';

const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1
};

const PhotoGallery = ({ photos }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">No photos found.</p>
      </div>
    );
  }

  const handleDownload = async (e, url) => {
    e.stopPropagation();
    const filename = url.split('/').pop()?.split('?')[0] || `event-photo-${Date.now()}.jpg`;

    try {
      // First attempt: Try fetching the S3 URL directly (works if S3 CORS is enabled)
      try {
        const directResponse = await fetch(url);
        if (directResponse.ok) {
          const blob = await directResponse.blob();
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(objectUrl);
          return; // Success
        }
      } catch (directErr) {
        console.warn('Direct S3 fetch failed (possibly CORS). Falling back to backend proxy.', directErr);
      }

      // Second attempt: Fallback to backend proxy (for watermarking or CORS bypass)
      let mediaPath = null;
      if (url.includes('/event_photos/')) {
        mediaPath = 'event_photos/' + url.split('/event_photos/')[1].split('?')[0];
      } else if (url.includes('/media/')) {
        mediaPath = url.split('/media/')[1].split('?')[0];
      }
      
      if (!mediaPath) {
         throw new Error('Not a recognizable media URL for proxy fallback');
      }

      const downloadUrl = `${api.defaults.baseURL}/download-photo/?path=${encodeURIComponent(mediaPath)}`;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Download failed entirely, opening in new tab:', err);
      // Fallback: forcefully trigger a download attribute on an anchor tag
      // This sometimes works better than window.open for same-origin or specific browser settings
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {photos.map((photoUrl, index) => (
          <div key={index} className="gallery-item">
            <img
              src={photoUrl}
              alt={`Match ${index + 1}`}
              className="w-100 h-auto d-block gallery-image"
              onClick={() => setSelectedImage(photoUrl)}
              loading="lazy"
            />
            <div className="gallery-overlay">
              <button
                onClick={(e) => handleDownload(e, photoUrl)}
                className="btn btn-sm btn-light rounded-circle p-2 lh-1"
                aria-label="Download photo"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        ))}
      </Masonry>

      {/* Lightbox for full screen view */}
      {selectedImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 z-index-modal d-flex justify-content-center align-items-center"
          style={{ zIndex: 1050, backdropFilter: 'blur(5px)' }}
          onClick={() => setSelectedImage(null)}
        >
          {/* Top right close button is removed to avoid notch/header overlap */}
          
          <img 
            src={selectedImage} 
            alt="Full screen preview" 
            className="img-fluid" 
            style={{ maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />

          <div className="position-absolute bottom-0 mb-4 text-center w-100 d-flex justify-content-center gap-3">
             <button 
               onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
               className="btn btn-dark rounded-pill px-4 fw-medium shadow-sm d-flex align-items-center justify-content-center border-0 border-white text-white"
               style={{ gap: '8px', zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.6)' }}
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
               Close
             </button>
             <button 
               onClick={(e) => handleDownload(e, selectedImage)}
               className="btn btn-light rounded-pill px-4 fw-medium shadow-sm d-flex align-items-center justify-content-center"
               style={{ gap: '8px', zIndex: 1100 }}
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
               Download
             </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
