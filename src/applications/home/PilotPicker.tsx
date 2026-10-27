import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './pilot-picker.css';

type PilotPickerProps = {
  count: number;
  onChange: (index: number) => void;
};

const PilotPicker: React.FC<PilotPickerProps> = ({ count, onChange }) => {
  const [index, setIndex] = useState(0);
  const step = (by: number) => {
    const next = (index + by + count) % count;
    setIndex(next);
    onChange(next);
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
 * Mounts arrows that cycle the camera through `count` pilots, calling `onChange` with the
 * chosen one's index. Returns a function that removes them.
 */
export const createPilotPicker = (
  count: number,
  onChange: (index: number) => void
): (() => void) => {
  const container = document.createElement('div');
  container.id = 'pilot-picker';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<PilotPicker count={count} onChange={onChange} />);

  return () => {
    root.unmount();
    container.remove();
  };
};
