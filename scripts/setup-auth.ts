import { chromium } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { getBaseUrl, Env, Site } from '../utils/envUtils';
import path from 'path';
import fs from 'fs';

const STORAGE_DIR = path.resolve(__dirname, '../storage');
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Programmatic auth (may hit GM 403; prefer npm run setup-auth:manual). Run: npm run setup-auth */
async function setupAuth(env: Env = 'prod', site: Site = 'parts') {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`Setting up auth for ${env}/${site}...`);
    const authPage = new AuthPage(page);
    await authPage.login(env, site);
    await delay(2000);

    const storagePath = path.join(STORAGE_DIR, `auth-${site}.json`);
    await context.storageState({ path: storagePath });
    console.log(`✅ Auth state saved to ${storagePath}`);

    const visible = await authPage.profileButton.isVisible().catch(() => false);
    if (!visible) console.warn(`⚠️ Profile button not visible after login`);
  } catch (error) {
    console.error(`❌ Failed to setup auth:`, error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupAll() {
  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
  const env = (process.env.ENV || 'prod') as Env;
  try {
    await setupAuth(env, 'parts');
    await setupAuth(env, 'accessories');
    console.log('\n✅ Auth setup complete for both sites.');
  } catch (error) {
    console.error('\n❌ Auth setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) setupAll();

export { setupAuth, setupAll };
