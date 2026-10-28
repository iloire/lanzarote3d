import React from 'react';
import { createRoot } from 'react-dom/client';
import './location-switcher.css';

type LocationSwitcherProps = {
  places: { id: string; name: string }[];
  current: string;
};

/** One link per place; following it reloads the page in that place, so the URL can be shared */
const LocationSwitcher: React.FC<LocationSwitcherProps> = ({ places, current }) => (
  <nav className="location-switcher" aria-label="Choose a place">
    {places.map(({ id, name }) => {
      const search = new URLSearchParams(window.location.search);
      search.set('location', id);
      return (
        <a
          key={id}
          href={`?${search.toString()}`}
          aria-current={id === current ? 'page' : undefined}
        >
          {name}
        </a>
      );
    })}
  </nav>
);

/** Mounts the place links, `current` marked. Returns a function that removes them. */
export const createLocationSwitcher = (
  places: { id: string; name: string }[],
  current: string
): (() => void) => {
  const container = document.createElement('div');
  container.id = 'location-switcher';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<LocationSwitcher places={places} current={current} />);

  return () => {
    root.unmount();
    container.remove();
  };
};
