import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import EventCard from '../components/EventCard';
import EventPhotosModal from '../components/EventPhotosModal';
import { compressImageForUpload } from '../utils/imageUpload';
import { Upload, Loader, LogOut, Eye, EyeOff } from 'lucide-react';

const UPLOAD_CONCURRENCY = 2; // Reduced to prevent dropping network packets on large batches

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Login State
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // New Event State
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Upload Photo State
  const [selectedEventId, setSelectedEventId] = useState('');
  const [uploadFiles, setUploadFiles] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadElapsedSeconds, setUploadElapsedSeconds] = useState(0);
  const [uploadEtaSeconds, setUploadEtaSeconds] = useState(null);
  const [activePanel, setActivePanel] = useState('events');
  const activeEvents = events.filter((event) => event.status === 'active').length;

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchEvents();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!uploading) {
      return undefined;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setUploadElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [uploading]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events/');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      // In a real app we might register first, but let's assume login works or creates 
      // Actually we'll just try to login, handled by backend
      const res = await api.post('/auth/login/', { email, password });
      localStorage.setItem('token', res.data.token || res.data.id); // Simple hack for token
      // Wait, actual backend doesn't return token since we didn't setup token auth fully
      // We'll trust the session or just store a dummy token to flip the UI for local dev
      
      setIsLoggedIn(true);
    } catch (err) {
      setLoginError('Invalid credentials');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.post('/events/create/', {
        name: newEventName,
        event_date: newEventDate
      });
      setNewEventName('');
      setNewEventDate('');
      fetchEvents();
      setActivePanel('events');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This will also delete all its photos.')) return;
    try {
      await api.delete(`/events/${eventId}/delete/`);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete event.');
    }
  };

  const handleUploadPhotos = async (e) => {
    e.preventDefault();
    if (!uploadFiles || !selectedEventId) return;

    setUploading(true);
    setUploadMessage('');
    setUploadProgress(0);
    setUploadElapsedSeconds(0);
    setUploadEtaSeconds(null);
    try {
      setUploadMessage('Processing and uploading photos...');
      const uncompressedFiles = Array.from(uploadFiles);
      const totalBytes = uncompressedFiles.reduce((sum, file) => sum + file.size, 0);
      const uploadedBytesByFile = new Array(uncompressedFiles.length).fill(0);
      const startedAt = Date.now();
      let uploadedCount = 0;
      let failedCount = 0;

      setUploadMessage('');

      const updateUploadMetrics = (fileIndex, loadedBytes, originalFileSize) => {
        // We track progress against the original uncompressed file size
        uploadedBytesByFile[fileIndex] = Math.min(loadedBytes, originalFileSize);
        const uploadedBytes = uploadedBytesByFile.reduce((sum, bytes) => sum + bytes, 0);
        const progress = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;
        const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 1);

        setUploadProgress(progress);
        setUploadElapsedSeconds(Math.floor(elapsedSeconds));

        if (uploadedBytes > 0 && uploadedBytes < totalBytes) {
          const bytesPerSecond = uploadedBytes / elapsedSeconds;
          const remainingBytes = totalBytes - uploadedBytes;
          setUploadEtaSeconds(Math.ceil(remainingBytes / bytesPerSecond));
        } else {
          setUploadEtaSeconds(0);
        }
      };

      for (let i = 0; i < uncompressedFiles.length; i += UPLOAD_CONCURRENCY) {
        // Take chunk of 4 uncompressed files
        const uncompressedChunk = uncompressedFiles.slice(i, i + UPLOAD_CONCURRENCY);
        
        // Compress safely (if one fails, use original)
        const compressedChunk = await Promise.all(
          uncompressedChunk.map(async (file) => {
            try { return await compressImageForUpload(file); }
            catch (e) { return file; } // fallback to uncompressed
          })
        );

        const results = await Promise.allSettled(
          compressedChunk.map((file, chunkIndex) => {
            const fileIndex = i + chunkIndex;
            const originalFile = uncompressedChunk[chunkIndex];
            
            const formData = new FormData();
            formData.append('image', file);
            return api.post(`/events/${selectedEventId}/upload/`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (progressEvent) => {
                let approxLoaded = progressEvent.loaded;
                if (progressEvent.total) {
                   approxLoaded = (progressEvent.loaded / progressEvent.total) * originalFile.size;
                }
                updateUploadMetrics(fileIndex, approxLoaded, originalFile.size);
              }
            });
          })
        );

        uploadedCount += results.filter((result) => result.status === 'fulfilled').length;
        failedCount += results.filter((result) => result.status === 'rejected').length;
      }

      setUploadProgress(100);
      setUploadEtaSeconds(0);
      
      if (failedCount > 0) {
        setUploadMessage(`Uploaded ${uploadedCount} photos, but ${failedCount} failed to upload. Please check your connection.`);
      } else {
        setUploadMessage(`Successfully uploaded all ${uploadedCount} photos!`);
      }
      setUploadFiles(null);
      e.target.reset();
    } catch (err) {
      console.error(err);
      setUploadMessage('Some photos failed to upload. Please retry the failed files.');
    } finally {
      setUploading(false);
    }
  };

  const handleEventUpdated = (updatedEvent) => {
    setEvents((prev) => prev.map((event) => (
      event.id === updatedEvent.id ? updatedEvent : event
    )));
  };

  if (!isLoggedIn) {
    return (
      <div className="auth-page py-5">
        <div className="container">
          <div className="auth-shell reveal">
            <div className="auth-panel">
              <p className="eyebrow">Organizer Access</p>
              <h2>Manage events with a premium control center</h2>
              <p>
                Create events, upload albums in batches, and control guest access from one
                streamlined dashboard.
              </p>
            </div>
            <div className="auth-card">
              <h3 className="fw-semibold mb-4">Organizer Login</h3>
              {loginError && <div className="alert alert-danger py-2">{loginError}</div>}
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-bold">Email address</label>
                  <input
                    type="email"
                    className="form-control form-control-lg auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label text-muted small fw-bold">Password</label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control form-control-lg auth-input pe-5"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent text-muted px-3"
                      style={{ zIndex: 10, cursor: 'pointer' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-gradient btn-lg w-100 fw-medium">
                  Sign In
                </button>
              </form>
              <div className="text-center mt-3">
                <Link to="/forgot-password" className="auth-link small fw-medium">
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page dashboard-shell">
      <aside className="dashboard-rail">

        <div className="dashboard-rail-scroll">
          <button
            type="button"
            className={`dashboard-nav-item ${activePanel === 'create' ? 'is-active' : ''}`}
            onClick={() => setActivePanel('create')}
          >
            Create Event
          </button>
          <button
            type="button"
            className={`dashboard-nav-item ${activePanel === 'events' ? 'is-active' : ''}`}
            onClick={() => setActivePanel('events')}
          >
            Your Events
          </button>
          <button
            type="button"
            className={`dashboard-nav-item ${activePanel === 'upload' ? 'is-active' : ''}`}
            onClick={() => setActivePanel('upload')}
          >
            Upload Photos
          </button>
        </div>

        <div className="dashboard-rail-footer">
          <p className="dashboard-rail-meta">Organizers</p>
          <button type="button" className="dashboard-rail-logout dashboard-rail-logout-main" onClick={handleLogout}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      <section className="dashboard-main dashboard-workspace">
        {activePanel === 'create' && (
          <div className="dashboard-content-card">
            <div className="dashboard-head mb-4">
              <p className="eyebrow mb-2">Dashboard</p>
              <h2 className="fw-bold mb-0">Create Event</h2>
            </div>
            <form onSubmit={handleCreateEvent} className="dashboard-form-max">
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">Event Name</label>
                <input
                  type="text"
                  className="form-control auth-input border-0"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">Date</label>
                <input
                  type="date"
                  className="form-control auth-input border-0"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={creating} className="btn btn-gradient fw-medium">
                {creating ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>
        )}

        {activePanel === 'events' && (
          <>
            <div className="dashboard-head mb-4">
              <p className="eyebrow mb-2">Dashboard</p>
              <h2 className="fw-bold mb-0">Your Events</h2>
            </div>

            <div className="dashboard-overview mb-4 dashboard-stats-inline">
              <div className="overview-chip">
                <p>Total</p>
                <strong>{events.length}</strong>
              </div>
              <div className="overview-chip">
                <p>Active</p>
                <strong>{activeEvents}</strong>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5 text-muted">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="dashboard-empty rounded-4 p-5 text-center text-muted">
                You haven't created any events yet.
              </div>
            ) : (
              <div className="row g-3">
                {events.map((event) => (
                  <div className="col-md-6 col-lg-4" key={event.id}>
                    <EventCard
                      event={event}
                      onDelete={handleDeleteEvent}
                      onViewPhotos={() => setSelectedEvent(event)}
                      onEventUpdated={handleEventUpdated}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activePanel === 'upload' && (
          <div className="dashboard-content-card">
            <div className="dashboard-head mb-4">
              <p className="eyebrow mb-2">Dashboard</p>
              <h2 className="fw-bold mb-0">Upload Photos</h2>
            </div>
            {uploadMessage && (
              <div className={`alert py-2 small ${uploadMessage.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
                {uploadMessage}
              </div>
            )}
            {uploading && (
              <div className="mb-3">
                <div className="d-flex justify-content-between small text-muted mb-2">
                  <span>{uploadProgress}% uploaded</span>
                  <span>
                    Elapsed: {uploadElapsedSeconds}s
                    {uploadEtaSeconds !== null ? ` | ETA: ${uploadEtaSeconds}s` : ''}
                  </span>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    style={{ width: `${uploadProgress}%` }}
                    aria-valuenow={uploadProgress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
              </div>
            )}
            <form onSubmit={handleUploadPhotos} className="dashboard-form-max">
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">Select Event</label>
                <select
                  className="form-select auth-input border-0 select-with-caret"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  required
                >
                  <option value="">-- Choose an event --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold">Photos (Batch)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="form-control auth-input border-0"
                  onChange={(e) => setUploadFiles(e.target.files)}
                  required
                />
              </div>
              <button type="submit" disabled={uploading || !selectedEventId} className="btn upload-submit-btn fw-medium text-white">
                {uploading ? (
                  <>
                    <Loader size={16} className="me-2 spinning" /> Uploading...
                  </>
                ) : 'Upload Batch'}
              </button>
            </form>
          </div>
        )}
      </section>

      {selectedEvent && (
        <EventPhotosModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
