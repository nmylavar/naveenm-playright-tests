/** Environment and site config for parts/accessories base URLs. Used by playwright.config and scripts. */
export type Env = 'dev' | 'staging' | 'prod';
export type Site = 'parts' | 'accessories';

const BASE_URLS: Record<Site, string> = {
  parts: 'https://parts.chevrolet.com/',
  accessories: 'https://accessories.chevrolet.com/',
};

const siteConfig: Record<Env, Record<Site, string>> = {
  dev: BASE_URLS,
  staging: BASE_URLS,
  prod: BASE_URLS,
};

export const getBaseUrl = (env: Env = 'prod', site: Site = 'parts'): string => {
  return siteConfig[env][site];
};

export const getEnvFromProcess = (): Env =>
  (process.env.ENV || process.env.TEST_ENV || 'prod') as Env;

export const getSiteFromProcess = (): Site =>
  (process.env.SITE || 'parts') as Site;

