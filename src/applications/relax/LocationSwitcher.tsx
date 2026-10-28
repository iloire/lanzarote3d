import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Place, groupByRegion, matchPlaces, neighbours, placeHref } from './places';
import './location-switcher.css';

type LocationSwitcherProps = {
  places: Place[];
  current: string;
};

/**
 * The current place with steps to the previous and next, and a list of every place by region
 * with a search box. Each place is a link that reloads the page there, so the URL can be shared.
 */
const LocationSwitcher: React.FC<LocationSwitcherProps> = ({ places, current }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLElement>(null);
  const here = places.find(({ id }) => id === current) ?? places[0]!;
  const { previous, next } = neighbours(places, here.id);
  const matches = matchPlaces(places, query);

  // A click elsewhere or Escape closes the list
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onSearchKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && matches[0]) window.location.search = placeHref(matches[0].id);
  };

  return (
    <nav className="place-picker" aria-label="Choose a place" ref={root}>
      {open && (
        <div className="place-picker__panel" id="place-picker-list">
          <input
            className="place-picker__search"
            type="search"
            placeholder="Search places"
            aria-label="Search places"
            autoFocus
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={onSearchKey}
          />
          <div className="place-picker__list">
            {groupByRegion(matches).map(({ region, places: inRegion }) => (
              <section key={region}>
                <h2>{region}</h2>
                <ul>
                  {inRegion.map(({ id, name }) => (
                    <li key={id}>
                      <a href={placeHref(id)} aria-current={id === here.id ? 'page' : undefined}>
                        {name}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {matches.length === 0 && (
              <p className="place-picker__empty">
                No place matches “{query}”. Clear the search to see all {places.length}.
              </p>
            )}
          </div>
        </div>
      )}
      <div className="place-picker__bar">
        <a className="place-picker__step" href={placeHref(previous.id)} title={previous.name}>
          <span aria-hidden="true">&lt;</span>
          <span className="visually-hidden">Previous place: {previous.name}</span>
        </a>
        <button
          className="place-picker__current"
          type="button"
          aria-expanded={open}
          aria-controls="place-picker-list"
          onClick={() => setOpen(!open)}
        >
          <span className="place-picker__name">{here.name}</span>
          <span className="place-picker__region">
            {here.region} · {places.length} places
          </span>
        </button>
        <a className="place-picker__step" href={placeHref(next.id)} title={next.name}>
          <span aria-hidden="true">&gt;</span>
          <span className="visually-hidden">Next place: {next.name}</span>
        </a>
      </div>
    </nav>
  );
};

/** Mounts the place picker, `current` marked. Returns a function that removes it. */
export const createLocationSwitcher = (places: Place[], current: string): (() => void) => {
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
