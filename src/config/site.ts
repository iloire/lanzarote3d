/**
 * Which site this bundle is. One repo builds two sites: the Lanzarote one
 * (3d.lanzaroteparagliding.com, `npm run build`) and the relax one, every place in 3D
 * (`npm run build:relax`, which sets SITE=relax). Each app in apps.json belongs to one of them.
 */
export type Site = 'lanzarote' | 'relax';

export const SITE: Site = process.env.SITE === 'relax' ? 'relax' : 'lanzarote';

/** The story a site opens on when the URL names none */
export const SITE_HOME: Record<Site, string> = { lanzarote: 'home', relax: 'relax' };
