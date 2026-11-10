import { Theme } from '../types/Theme';
import { isChristmas } from '../../shared/christmas';

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
  clouds: {},
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

/**
 * The same look at Christmas, with snow on the volcanoes: on the level faces from about 390 m up
 * (850 world units; the island's heights are drawn 2.2x), lying full by 500 m, so the top of
 * the Risco, Peñas del Chache and the Timanfaya cones turn white while the coast stays warm.
 */
export const CHRISTMAS_THEME: Theme = {
  ...DEFAULT_THEME,
  id: 'christmas',
  name: 'Christmas',
  terrain: {
    ...DEFAULT_THEME.terrain,
    underlay: {
      ...DEFAULT_THEME.terrain.underlay!,
      snow: { color: '#f2f6fa', from: 850, to: 1100 },
    },
  },
};

/** The look for today: Christmas in season or with ?christmas, the default otherwise */
export const getDefaultTheme = (): Theme => (isChristmas() ? CHRISTMAS_THEME : DEFAULT_THEME);
