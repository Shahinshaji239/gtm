import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Trash2, ImageIcon, Loader } from 'lucide-react';

const EventPhotosModal = ({ event, onClose }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [event.id]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${event.id}/photos/`);
      setPhotos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      setDeleting(photoId);
      await api.delete(`/events/${event.id}/photos/${photoId}/delete/`);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete photo.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (photos.length === 0) return;
    if (!window.confirm(`Delete all ${photos.length} photos from this event?`)) return;

    try {
      setDeletingAll(true);
      await api.delete(`/events/${event.id}/photos/delete-all/`);
      setPhotos([]);
    } catch (err) {
      console.error(err);
      alert('Failed to delete all photos.');
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center event-modal-backdrop"
      style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="event-modal bg-white rounded-4 shadow-lg overflow-hidden"
        style={{ width: '90%', maxWidth: '860px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
          <div>
            <h5 className="fw-bold mb-0">{event.name}</h5>
            <p className="text-muted small mb-0">{photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            {photos.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={deletingAll}
                className="btn btn-danger btn-sm rounded-pill px-3"
              >
                {deletingAll ? (
                  <>
                    <Loader size={14} className="me-2" style={{ animation: 'spin 1s linear infinite' }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} className="me-2" />
                    Delete All
                  </>
                )}
              </button>
            )}
            <button onClick={onClose} className="btn btn-light rounded-circle p-2 lh-1 border-0">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-auto p-4 flex-grow-1">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Loader size={32} className="text-muted" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <ImageIcon size={48} className="mb-3 opacity-25" />
              <p>No photos uploaded for this event yet.</p>
            </div>
          ) : (
            <div className="row g-3">
              {photos.map(photo => (
                <div key={photo.id} className="col-6 col-sm-4 col-md-3">
                  <div className="position-relative rounded-3 overflow-hidden event-modal-photo" style={{ paddingTop: '100%' }}>
                    <img
                      src={photo.image_url || photo.image}
                      alt="Event photo"
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                    {/* Delete overlay */}
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end justify-content-end p-2"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }}
                    >
                      <button
                        onClick={() => handleDelete(photo.id)}
                        disabled={deleting === photo.id}
                        className="btn btn-sm btn-danger rounded-circle p-1 lh-1"
                        title="Delete photo"
                      >
                        {deleting === photo.id
                          ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventPhotosModal;
