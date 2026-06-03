import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventPage from './pages/EventPage';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100 bg-light">
        <Navbar />
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/event/:eventId" element={<EventPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </main>
        <footer className="bg-white py-4 text-center text-muted border-top border-light mt-auto shadow-sm">
          <small>
            &copy; {new Date().getFullYear()} Event Photo Discovery Platform.
            <br />
            Powered by <a href="https://scellent.com/" target="_blank" rel="noopener noreferrer" className="text-decoration-none fw-semibold" style={{ color: '#111111' }}>SCELLENT INNOVATIONS</a>
          </small>
        </footer>
      </div>
    </Router>
  );
}

export default App;
