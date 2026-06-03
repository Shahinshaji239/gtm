import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <header className="floating-nav-wrap">
      <div className="floating-nav floating-nav-centered">
        <Link className="studio-logo" to="/">
          Global Travel Market
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
