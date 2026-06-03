import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid || !token) {
      setError('Invalid or missing reset link. Please request a new one.');
    }
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/reset-password/', { uid, token, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/admin'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page py-5">
      <div className="container">
        <div className="auth-shell reveal">
          <div className="auth-panel">
            <p className="eyebrow">Password Update</p>
            <h2>Create a new secure password</h2>
            <p>
              This link lets you set a new password for your organizer account. Use a strong and
              unique password before continuing.
            </p>
          </div>
          <div className="auth-card">
            <h3 className="fw-semibold mb-1">Set new password</h3>
            <p className="text-muted small mb-4">Enter your new password below.</p>

            {success ? (
              <div className="text-center py-4">
                <CheckCircle size={48} className="text-success mb-3" />
                <h5 className="fw-bold">Password updated!</h5>
                <p className="text-muted">Redirecting you to login...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold">New Password</label>
                    <input
                      type="password"
                      className="form-control form-control-lg auth-input border-0"
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label text-muted small fw-bold">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control form-control-lg auth-input border-0"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading || !uid || !token} className="btn btn-gradient btn-lg w-100 fw-medium">
                    {loading ? <Loader size={18} className="me-2" style={{ animation: 'spin 1s linear infinite' }} /> : null}
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
                <p className="text-center text-muted small mt-3">
                  <Link to="/admin" className="auth-link">Back to Login</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
