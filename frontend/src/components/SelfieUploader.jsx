import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

const SelfieUploader = ({ onUpload, isLoading, uploadError }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const onGalleryClick = () => {
    galleryInputRef.current.click();
  };

  const onCameraClick = () => {
    cameraInputRef.current.click();
  };

  const submitSelfie = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="bg-white p-4 p-md-5 text-start shadow-sm" style={{ borderRadius: '20px' }}>
      <h3 className="fw-bold mb-2 text-dark">Find Your Photos</h3>
      <p className="text-muted mb-4 pb-2" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
        Upload a quick selfie, and our AI will fetch all the photos you appear in. We use
        secure biometric matching to instantly scan thousands of moments.
      </p>

      {!preview ? (
        <div className="mb-4">
          <div
            className={`cursor-pointer d-flex flex-column align-items-center justify-content-center py-5 mb-4 ${dragActive ? 'bg-light' : ''}`}
            style={{ border: '1px dashed #ced4da', borderRadius: '16px', backgroundColor: '#F8F9FA' }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={onGalleryClick}
          >
            <input
              ref={galleryInputRef}
              type="file"
              className="d-none"
              accept="image/jpeg, image/png, image/jpg"
              onChange={handleChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              className="d-none"
              accept="image/jpeg, image/png, image/jpg"
              capture="user"
              onChange={handleChange}
            />
            <div className="rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '48px', height: '48px', backgroundColor: '#E2E8F0', color: '#0057C0' }}>
              <UploadCloud size={24} strokeWidth={2.5} />
            </div>
            <h6 className="fw-bold mb-1 text-dark">Drop your selfie here</h6>
            <p className="small text-muted fw-bold mb-0" style={{ letterSpacing: '0.5px', fontSize: '10px' }}>OR CLICK TO SELECT FILE</p>
          </div>
          <div className="d-flex gap-3">
            <button className="btn btn-primary rounded-pill px-4 py-2 fw-medium d-flex align-items-center justify-content-center gap-2" style={{ backgroundColor: '#0057C0', borderColor: '#0057C0' }} onClick={onCameraClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              Take a Selfie
            </button>
            <button className="btn btn-light rounded-pill px-4 py-2 fw-medium d-flex align-items-center justify-content-center gap-2 bg-light border-0 text-dark" onClick={onGalleryClick} style={{ backgroundColor: '#E2E8F0' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              Browse Gallery
            </button>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column align-items-center uploader-preview-block">
          <div className="position-relative mb-3 d-inline-block uploader-preview-wrap">
            <img
              src={preview}
              alt="Selfie preview"
              className="rounded-circle object-fit-cover shadow uploader-preview"
            />
            <button
              className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 shadow uploader-remove-btn"
              onClick={() => { setFile(null); setPreview(null); }}
              disabled={isLoading}
            >
              ✕
            </button>
          </div>

          {uploadError && (
            <div className="alert alert-danger d-flex align-items-center mb-3 w-100 py-2 small" role="alert">
              <AlertCircle size={16} className="me-2" />
              <div>{uploadError}</div>
            </div>
          )}

          <button
            onClick={submitSelfie}
            disabled={isLoading || !file}
            className="btn btn-gradient d-flex align-items-center fw-medium rounded-pill px-5 py-2 mt-2"
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Searching for matches...
              </>
            ) : (
              <>
                <CheckCircle size={18} className="me-2" />
                Find My Photos
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SelfieUploader;
