import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const services = [
    'AI Face Matching',
    'Real-Time Delivery',
    'Privacy Protected',
  ];



  return (
    <div className="studio-home">
      <section className="studio-hero">
        <div className="container studio-hero-grid reveal">
          <div className="studio-hero-copy">
            <p className="studio-kicker">Global Travel Market</p>
            <h1>Find Every Moment. Instantly.</h1>
            <p className="studio-subtext">
              AI-powered event photo discovery designed with a clean studio-grade workflow.
            </p>
            <div className="studio-actions">
              <Link to="/admin" className="studio-black-btn">Organizer Access</Link>
            </div>
          </div>

          <div className="studio-hero-visual reveal reveal-delay-1">
            <div className="mockup-rock" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800')", backgroundSize: "cover", backgroundPosition: "center", filter: "none" }} />
            <div className="mockup-card">
              <p>Real-time matching</p>
              <h4>98% Retrieval Precision</h4>
              <span>Across large event galleries</span>
            </div>
          </div>
        </div>
      </section>

      <section className="studio-stats">
        <div className="container stats-grid">
          <article className="stats-card tilt-left reveal">
            <div className="stats-media" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=600')", backgroundSize: "cover", backgroundPosition: "center" }} />
            <h3>50+</h3>
            <p>flagship events delivered</p>
          </article>
          <article className="stats-card reveal">
            <div className="stats-media" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=600')", backgroundSize: "cover", backgroundPosition: "center" }} />
            <h3>98%</h3>
            <p>average match confidence</p>
          </article>
          <article className="stats-card tilt-right reveal">
            <div className="stats-media" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=600')", backgroundSize: "cover", backgroundPosition: "center" }} />
            <h3>24h</h3>
            <p>automated retention cycle</p>
          </article>
        </div>
      </section>

      <section id="services" className="studio-section">
        <div className="container section-head reveal">
          <p className="studio-kicker">Resources</p>
          <h2>Core Capabilities</h2>
        </div>
        <div className="container studio-list-grid">
          {services.map((item) => (
            <article key={item} className="studio-list-card reveal">
              <h4>{item}</h4>
            </article>
          ))}
        </div>
      </section>



      <section id="about" className="studio-section">
        <div className="container about-editorial reveal">
          <p className="studio-kicker">About</p>
          <h2>Minimal Interface. Serious Performance.</h2>
          <p>
            We create frictionless systems for event teams that need elegant visual design and
            reliable delivery at scale.
          </p>
        </div>
      </section>

      <footer id="contact" className="studio-footer">
        <div className="container studio-footer-inner">
          <p>Global Travel Market</p>
          <a href="mailto:info@scellent.com">info@scellent.com</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
