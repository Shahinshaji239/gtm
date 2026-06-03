import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password/', { email });
      setMessage(
        res.data?.message ||
          'If this email is registered, a reset link has been sent.'
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Unable to send reset instructions right now.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page py-5">
      <div className="container">
        <div className="auth-shell reveal">
          <div className="auth-panel">
            <p className="eyebrow">Account Recovery</p>
            <h2>Reset your organizer credentials securely</h2>
            <p>
              Enter the email associated with your account and we will send reset instructions.
            </p>
          </div>
          <div className="auth-card">
            <h3 className="fw-semibold mb-1">Forgot password?</h3>
            <p className="text-muted small mb-4">
              Enter your email and the reset link will be printed in the backend
              console for now.
            </p>

            {message ? (
              <div className="text-center py-4">
                <CheckCircle size={48} className="text-success mb-3" />
                <h5 className="fw-bold">Check the backend console</h5>
                <p className="text-muted mb-0">{message}</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label text-muted small fw-bold">
                      Email address
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg auth-input border-0"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-gradient btn-lg w-100 fw-medium"
                  >
                    {loading ? (
                      <Loader
                        size={18}
                        className="me-2"
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                    ) : null}
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}

            <p className="text-center text-muted small mt-3 mb-0">
              <Link to="/admin" className="auth-link">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
