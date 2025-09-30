import React from 'react';
import { createRoot } from 'react-dom/client';
import TileDebugPage from './TileDebugPage';
import { logger } from '../../foundation/utils/logger';

// Import CSS if needed
import '../../index.css';

// Override global CSS to allow scrolling for this page
document.documentElement.style.overflow = 'auto';
document.body.style.overflow = 'auto';
document.body.style.height = 'auto';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<TileDebugPage />);
} else {
  logger.error('Root element not found');
}
