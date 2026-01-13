import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { NAVIGATION_LINKS, NavigationLink } from './config';
import './navigation-boxes.css';

interface NavigationBoxProps {
  link: NavigationLink;
}

const NavigationBox: React.FC<NavigationBoxProps> = ({ link }) => {
  const handleClick = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      className="nav-box"
      onClick={handleClick}
      title={link.description}
      aria-label={`Open ${link.description}`}
    >
      <div className="nav-box-icon">{link.icon}</div>
      <div className="nav-box-label">{link.label}</div>
      <div className="nav-box-description">{link.description}</div>
    </button>
  );
};

const NavigationBoxes: React.FC = () => {
  return (
    <div className="navigation-boxes-container">
      <div className="navigation-boxes">
        {NAVIGATION_LINKS.map((link) => (
          <NavigationBox key={link.id} link={link} />
        ))}
      </div>
    </div>
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
