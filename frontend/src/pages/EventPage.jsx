import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import SelfieUploader from '../components/SelfieUploader';
import PhotoGallery from '../components/PhotoGallery';
import { compressImageForUpload } from '../utils/imageUpload';

const EventPage = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const [matches, setMatches] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoadingEvent(true);
      const res = await api.get(`/events/${eventId}/`);
      setEventData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleSelfieUpload = async (file) => {
    if (!file) return;

    setIsSearching(true);
    setSearchError('');
    setMatches(null);

    try {
      // Compress the selfie right before searching to improve upload speeds dynamically!
      const compressedSelfie = await compressImageForUpload(file);

      const formData = new FormData();
      formData.append('selfie', compressedSelfie);

      const res = await api.post(`/events/${eventId}/search-face/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMatches(res.data.matched_photos || []);
    } catch (err) {
      console.error(err);
      setSearchError(err.response?.data?.error || 'Failed to search photos. Try again.');
    } finally {
      setIsSearching(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="event-page container d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading event...</span>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="event-page container py-5 text-center">
        <h2 className="text-dark">Event not found.</h2>
        <p className="text-muted">The link might be invalid or the event has been removed.</p>
      </div>
    );
  }

  return (
    <div className="event-page py-5">
      <div className="container">
        <div className="event-hero reveal text-start mb-5" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: '0' }}>
          <span className="badge rounded-pill text-primary bg-primary bg-opacity-10 px-3 py-2 mb-3" style={{ fontSize: '11px', letterSpacing: '1px', fontWeight: 'bold' }}>
            {new Date(eventData.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
          </span>
          <h1 className="display-2 fw-bold text-dark mb-4" style={{ letterSpacing: '-2px' }}>{eventData.name || 'day-1'}</h1>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center">
              <img src="https://i.pravatar.cc/150?img=1" alt="Attendee" className="rounded-circle border border-2 border-white object-fit-cover" width="36" height="36" style={{ zIndex: 3 }} />
              <img src="https://i.pravatar.cc/150?img=2" alt="Attendee" className="rounded-circle border border-2 border-white object-fit-cover ms-n2" width="36" height="36" style={{ zIndex: 2, marginLeft: '-12px' }} />
              <img src="https://i.pravatar.cc/150?img=3" alt="Attendee" className="rounded-circle border border-2 border-white object-fit-cover ms-n2" width="36" height="36" style={{ zIndex: 1, marginLeft: '-12px' }} />
              <div className="rounded-circle bg-light border border-2 border-white ms-n2 d-flex align-items-center justify-content-center text-muted" style={{ width: '36px', height: '36px', zIndex: 0, marginLeft: '-12px', fontSize: '11px', fontWeight: 'bold' }}>+22</div>
            </div>
            <span className="text-muted small fw-semibold">Attendees curated moments</span>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-7">
            <SelfieUploader
              onUpload={handleSelfieUpload}
              isLoading={isSearching}
              uploadError={searchError}
            />
          </div>
          <div className="col-lg-5 d-flex flex-column gap-3">
            <div className="card border-0 text-white p-4" style={{ borderRadius: '20px', backgroundColor: '#0057C0' }}>
              <div className="mb-4 opacity-75">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
              </div>
              <h2 className="display-4 fw-bold mb-1" style={{ letterSpacing: '-1.5px', marginTop: '1rem' }}>1,240+</h2>
              <p className="small mb-1 fw-bold" style={{ letterSpacing: '1px', fontSize: '11px' }}>MEMORIES CAPTURED TODAY</p>
            </div>
            <div className="card border-0 p-4" style={{ borderRadius: '20px', backgroundColor: '#F3F4F6' }}>
              <div className="d-flex mb-4">
                <div className="me-3 mt-1 text-primary bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', minWidth: '36px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <div>
                  <h6 className="fw-bold mb-1 text-dark">Privacy First</h6>
                  <p className="small text-muted mb-0 lh-sm">Secure biometric matching with encrypted local processing.</p>
                </div>
              </div>
              <div className="d-flex">
                <div className="me-3 mt-1 text-primary bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', minWidth: '36px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                </div>
                <div>
                  <h6 className="fw-bold mb-1 text-dark">Instant Results</h6>
                  <p className="small text-muted mb-0 lh-sm">Powered by Global Travel Market for sub-second recognition.</p>
                </div>
              </div>
            </div>
            <div className="card border-0 text-white p-4 position-relative overflow-hidden flex-grow-1" style={{ borderRadius: '20px', backgroundColor: '#1A2128', minHeight: '130px' }}>
              <div className="position-absolute w-200 h-200 top-50 start-50 translate-middle" style={{ opacity: 0.15, transform: 'translate(-50%, -50%)', width: '200%', height: '200%', backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
              <div className="mt-auto position-relative z-1 pt-4">
                <p className="small mb-1 fw-bold opacity-75" style={{ letterSpacing: '1px', fontSize: '10px', color: '#8A97A8' }}>PLATFORM POWER</p>
                <h5 className="fw-bold mb-1">SCELLENT INNOVATIONS</h5>
                <div className="d-flex flex-column gap-1">
                  <p className="small mb-0 fw-medium">
                    <a
                      href="tel:+919037949595"
                      className="d-inline-flex align-items-center gap-1 text-decoration-none"
                      style={{ color: '#8A97A8', transition: 'color 0.2s ease-in-out' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#8A97A8'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      +91 9037949595
                    </a>
                  </p>
                  <p className="small mb-0 fw-medium">
                    <a
                      href="https://scellent.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="d-inline-flex align-items-center gap-1 text-decoration-none"
                      style={{ color: '#8A97A8', transition: 'color 0.2s ease-in-out' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#8A97A8'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                      scellent.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {matches !== null && (
          <div className="matches-wrap mt-4 pt-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h3 className="fw-semibold m-0 d-flex align-items-center">
                Your Matches
                <span className="badge bg-primary ms-3 rounded-pill fs-6">{matches.length}</span>
              </h3>
            </div>
            <PhotoGallery photos={matches} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPage;
