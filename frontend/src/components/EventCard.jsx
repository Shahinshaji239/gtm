import React, { useState } from 'react';
import { Calendar, Tag, Link as LinkIcon, Download, Check, Trash2, Images, Pencil, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const EventCard = ({ event, onDelete, onViewPhotos, onEventUpdated }) => {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [eventName, setEventName] = useState(event.name);
  const [savingName, setSavingName] = useState(false);

  const eventUrl = `${window.location.origin}/event/${event.id}`;

  const handleCopyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(eventUrl).catch(console.error);
    } else {
      // Fallback for non-HTTPS connections
      const textArea = document.createElement("textarea");
      textArea.value = eventUrl;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.prepend(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (error) {
        console.error("Clipboard fallback failed", error);
      } finally {
        textArea.remove();
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(event.qr_code_url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `event-${event.name}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      // Fallback if CORS prevents fetch
      window.open(event.qr_code_url, '_blank');
    }
  };

  const handleRenameEvent = async () => {
    const trimmedName = eventName.trim();
    if (!trimmedName || trimmedName === event.name) {
      setEditing(false);
      setEventName(event.name);
      return;
    }

    try {
      setSavingName(true);
      const response = await api.patch(`/events/${event.id}/update/`, {
        name: trimmedName,
      });
      onEventUpdated?.(response.data);
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update event name.');
      setEventName(event.name);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="event-card h-100 p-3">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          {editing ? (
            <div className="d-flex align-items-center gap-2 mb-2">
              <input
                type="text"
                className="form-control form-control-sm"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                disabled={savingName}
                autoFocus
              />
              <button
                type="button"
                onClick={handleRenameEvent}
                disabled={savingName}
                className="btn btn-sm btn-primary"
              >
                {savingName ? <Loader size={14} className="spinning" /> : 'Save'}
              </button>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2 mb-1">
              <h5 className="card-title fw-bold text-dark mb-0 text-truncate pe-3">
                {event.name}
              </h5>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="btn btn-sm btn-light border-0 p-1"
                title="Edit Event Name"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
          <span className={`badge ${event.status === 'active' ? 'bg-success' : 'bg-secondary'} rounded-pill text-uppercase`} style={{ fontSize: '0.7rem' }}>
            {event.status}
          </span>
        </div>
        {onDelete && (
          <button 
            onClick={() => onDelete(event.id)} 
            className="btn btn-sm btn-outline-danger border-0 p-1"
            title="Delete Event"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
      
      <div className="card-body p-0 d-flex flex-column">
        <p className="card-text text-muted d-flex align-items-center mb-2">
          <Calendar size={16} className="me-2" />
          {new Date(event.event_date).toLocaleDateString()}
        </p>
        <p className="card-text text-muted d-flex align-items-center mb-4">
          <Tag size={16} className="me-2" />
          ID: <span className="text-monospace ms-1 small">{event.id.split('-')[0]}...</span>
        </p>

        {event.qr_code_url && (
          <div className="text-center mb-3 event-qr-box p-3 rounded position-relative group">
            <img 
              src={event.qr_code_url} 
              alt="Event QR" 
              className="img-fluid rounded mb-3" 
              style={{ maxHeight: '140px' }} 
            />
            <div className="d-flex justify-content-center gap-2">
              <button
                onClick={handleCopyLink} 
                className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                title="Copy Event Link"
              >
                {copied ? <Check size={14} className="me-1 text-success" /> : <LinkIcon size={14} className="me-1" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleDownloadQR} 
                className="btn btn-outline-primary btn-sm d-flex align-items-center"
                title="Download QR"
              >
                <Download size={14} className="me-1" />
                QR Code
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-auto pt-2 d-flex flex-column gap-2">
          {onViewPhotos && (
            <button
              onClick={onViewPhotos}
              className="btn btn-outline-secondary w-100 fw-medium rounded-pill d-flex align-items-center justify-content-center gap-2"
            >
              <Images size={16} /> View Photos
            </button>
          )}
          <Link to={`/event/${event.id}`} className="btn btn-gradient w-100 fw-medium rounded-pill">
            View Guest Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
