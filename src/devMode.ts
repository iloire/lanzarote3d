/**
 * Dev mode: lists the private scenes and shows the sidebar on every scene, home included.
 *
 * - Always on at localhost (private scenes only; home keeps its clean, menu-less look)
 * - Anywhere else, open any page with ?dev=1 to turn it on for this browser, ?dev=0 to turn it off
 * - From the console: enableDevMode() / disableDevMode(), then reload
 *
 * The flag lives in localStorage under lanzarote_dev_mode.
 */
const STORAGE_KEY = 'lanzarote_dev_mode';

declare global {
  interface Window {
    enableDevMode?: () => void;
    disableDevMode?: () => void;
  }
}

function setDevFlag(on: boolean): void {
  if (on) localStorage.setItem(STORAGE_KEY, 'true');
  else localStorage.removeItem(STORAGE_KEY);
}

/** Apply ?dev=1 / ?dev=0 and expose the console helpers. Call once at startup. */
export function initDevMode(): void {
  const dev = new URLSearchParams(window.location.search).get('dev');
  if (dev === '1') setDevFlag(true);
  if (dev === '0') setDevFlag(false);

  window.enableDevMode = () => {
    setDevFlag(true);
    console.log('🔓 Dev mode enabled. Reload the page to activate.');
  };
  window.disableDevMode = () => {
    setDevFlag(false);
    console.log('🔒 Dev mode disabled. Reload the page to deactivate.');
  };

  if (isDevFlagSet()) console.log('🔓 Dev mode enabled (?dev=0 to turn it off)');
}

/** True when dev mode was switched on in this browser (?dev=1 or enableDevMode()). */
export function isDevFlagSet(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

/** True when private scenes should be listed: localhost, or the dev flag. */
export function isDevModeEnabled(): boolean {
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1' || isDevFlagSet();
}
