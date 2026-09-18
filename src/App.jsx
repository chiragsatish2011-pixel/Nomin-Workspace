import React from 'react';
import { Button } from './components/Button';
import { Badge } from './components/Badge';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <a href="#" className="logo text-sub-heading">Nomin</a>
        <nav>
          <Button variant="subtle" style={{ marginRight: '16px' }}>Sign In</Button>
          <Button variant="primary">Get Started</Button>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <Badge variant="success" style={{ marginBottom: '24px' }}>New Features Available</Badge>
          <h1 className="text-display-hero">The most trusted workspace</h1>
          <p className="text-body-medium">
            Experience the Kraken-inspired design system. Built for speed, trust, and beautiful aesthetics.
          </p>
          <div className="cta-group">
            <Button variant="primary">Create Workspace</Button>
            <Button variant="outlined">View Documentation</Button>
          </div>
        </section>

        <section className="features-grid">
          <div className="feature-card">
            <Badge variant="neutral">Design</Badge>
            <h3 className="text-feature-title">Kraken Purple</h3>
            <p className="text-body">Our components use the signature Kraken Purple for primary actions to build trust.</p>
            <Button variant="secondary">Learn More</Button>
          </div>
          <div className="feature-card">
            <Badge variant="neutral">Typography</Badge>
            <h3 className="text-feature-title">Beautiful Fonts</h3>
            <p className="text-body">A dual font system ensures maximum readability and stunning display text.</p>
            <Button variant="white">Learn More</Button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
