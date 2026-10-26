import { Theme } from '../types/Theme';

/**
 * The scenes' one look: sky, sea, fog, light and clouds. There used to be alternative presets
 * (Golden Hour, Arctic Winter, ...) and a picker in the menu; they're in git history before the
 * commit that removed them.
 */
export const DEFAULT_THEME: Theme = {
  id: 'default',
  name: 'Default',
  enabled: true,
  sky: {
    timeOfDay: 15,
    sunIntensity: 1.9,
  },
  clouds: {
    colors: ['#FFFFFF', '#F5F5F5', '#E8E8E8', '#D0D0D0'],
    density: 0.6,
    opacity: 0.85,
  },
  terrain: {
    style: 'wireframe',
    customMaterial: {
      color: '#8a6248',
      emissive: '#5c3a26',
      emissiveIntensity: 0.2,
      roughness: 0.8,
      metalness: 0.05,
      opacity: 1.0,
      wireframe: true,
      visible: true,
    },
    underlay: { color: '#34302d', peakColor: '#3f2f27', sandColor: '#b39668' },
  },
  water: {
    color: '#08304a',
    opacity: 1,
    shallowColor: '#23a9a6',
    shallowDistance: 700,
  },
  weather: {
    windDirectionDegreesFromNorth: 280,
    speedMetresPerSecond: 5,
    lclLevel: 1750,
  },
  ambient: {
    lightingIntensity: 1.05,
    shadowIntensity: 0.95,
  },
  atmosphere: {},
};

export const getDefaultTheme = (): Theme => DEFAULT_THEME;
