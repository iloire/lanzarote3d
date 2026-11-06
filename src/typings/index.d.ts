declare module '*.glb';
declare module '*.drc';
declare module '*.wav';
declare module '*.obj';
declare module '*.mp3';
declare module '*.mp4';
declare module '*.jpg';
declare module '*.png';

declare module 'glStats';
declare module 'threeStats';

interface Window {
  /** Google Analytics, from the tag in showcase.html; missing if blocked or on localhost */
  gtag?: (command: 'event', name: string, params: Record<string, string | number>) => void;
}
