import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './pilot-picker.css';

declare global {
  interface Window {
    /** Google Analytics, from the tag in showcase.html; missing if blocked */
    gtag?: (command: 'event', name: string, params: Record<string, string | number>) => void;
  }
}

type PilotPickerProps = {
  count: number;
  initial: number;
  onChange: (index: number) => void;
};

const PilotPicker: React.FC<PilotPickerProps> = ({ count, initial, onChange }) => {
  const [index, setIndex] = useState(initial);
  const step = (by: number) => {
    const next = (index + by + count) % count;
    setIndex(next);
    onChange(next);
    // Counts arrow use in GA; pilots are sent by number only, never by name
    window.gtag?.('event', 'pilot_switch', {
      pilot: next + 1,
      direction: by > 0 ? 'next' : 'previous',
    });
  };

  return (
    <nav className="pilot-picker" aria-label="Follow another pilot">
      <button type="button" aria-label="Previous pilot" onClick={() => step(-1)}>
        ‹
      </button>
      <span className="pilot-picker-count">
        {index + 1}/{count}
      </span>
      <button type="button" aria-label="Next pilot" onClick={() => step(1)}>
        ›
      </button>
    </nav>
  );
};

/**
 * Mounts arrows that cycle the camera through `count` pilots from `initial`, calling
 * `onChange` with the chosen one's index. Returns a function that removes them.
 */
export const createPilotPicker = (
  count: number,
  initial: number,
  onChange: (index: number) => void
): (() => void) => {
  const container = document.createElement('div');
  container.id = 'pilot-picker';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<PilotPicker count={count} initial={initial} onChange={onChange} />);

  return () => {
    root.unmount();
    container.remove();
  };
};
