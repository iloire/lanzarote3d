import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { NAVIGATION_LINKS, NavigationLink } from './config';
import './navigation-boxes.css';

interface NavigationBoxProps {
  link: NavigationLink;
  variant?: 'default' | 'featured';
}

const NavigationBox: React.FC<NavigationBoxProps> = ({ link, variant = 'default' }) => {
  const handleClick = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      className={`nav-box ${variant === 'featured' ? 'nav-box-featured' : ''}`}
      onClick={handleClick}
      title={link.description}
      aria-label={`Open ${link.description}`}
    >
      <div className="nav-box-icon">{link.icon}</div>
      <div className="nav-box-label">{link.label}</div>
      <div className="nav-box-description">{link.description}</div>
      {variant === 'featured' && <div className="nav-box-subtext">No experience needed</div>}
    </button>
  );
};

const VoxelTitle: React.FC = () => {
  return (
    <div className="voxel-title-container">
      <h1 className="voxel-title">
        <span className="voxel-title-main">Lanzarote</span>
        <span className="voxel-title-sub">Paragliding</span>
      </h1>
    </div>
  );
};

const NavigationBoxes: React.FC = () => {
  const pilotLinks = NAVIGATION_LINKS.filter((link) => link.category === 'pilot');
  const generalLinks = NAVIGATION_LINKS.filter((link) => link.category === 'general');

  return (
    <>
      <VoxelTitle />
      <div className="navigation-boxes-container">
        <p className="voxel-tagline">Are you ready to play?</p>

        {/* Featured section for general audience */}
        <div className="navigation-featured">
          {generalLinks.map((link) => (
            <NavigationBox key={link.id} link={link} variant="featured" />
          ))}
        </div>

        {/* Pilot tools section */}
        <div className="navigation-pilot-section">
          <span className="navigation-pilot-label">Pilot Tools</span>
          <div className="navigation-pilot-boxes">
            {pilotLinks.map((link) => (
              <NavigationBox key={link.id} link={link} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

let root: Root | null = null;

/**
 * Creates and mounts the navigation boxes UI
 */
export const createNavigationBoxes = (container: HTMLElement): (() => void) => {
  root = createRoot(container);
  root.render(<NavigationBoxes />);

  return () => {
    if (root) {
      root.unmount();
      root = null;
    }
  };
};

export default NavigationBoxes;
