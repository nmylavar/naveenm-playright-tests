import { chromium } from '@playwright/test';
import { getBaseUrl, Env, Site } from '../utils/envUtils';
import path from 'path';
import fs from 'fs';
import credentials from '../data/credentials.json';
import { NAV_TIMEOUT_MS, SETUP_POST_GOTO_MS, SETUP_POST_PROFILE_MS } from '../constants/waits';

const STORAGE_DIR = path.resolve(__dirname, '../storage');
const PROFILE_NAME = (credentials as { profileName?: string }).profileName ?? 'My Account';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Manual auth: open site, log in in the browser, then save storage state. Run: npm run setup-auth:manual */
async function setupAuthManual(env: Env = 'prod', site: Site = 'parts') {
  let browser;
  try {
    browser = await chromium.launch({
      headless: false,
      channel: 'chrome',
      args: ['--disable-blink-features=AutomationControlled', '--no-first-run', '--no-default-browser-check'],
    });
  } catch {
    browser = await chromium.launch({ headless: false, args: ['--disable-blink-features=AutomationControlled'] });
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const siteUrl = getBaseUrl(env, site);

  try {
    console.log(`\n📌 Manual auth setup for ${site}\n   ${siteUrl}\n   Log in in the browser (up to 3 min)...\n`);

    await page.goto(siteUrl, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS });

    const focusPasswordWhenReady = async () => {
      for (let i = 0; i < 60; i++) {
        await delay(SETUP_POST_GOTO_MS);
        try {
          const pw = page.getByRole('textbox', { name: /password/i }).first();
          if (await pw.isVisible().catch(() => false)) {
            await pw.focus();
            await pw.click();
            console.log('   → Password field focused; type your password.');
            return;
          }
        } catch {
          /* ignore */
        }
        for (const frame of page.frames()) {
          try {
            const pw = frame.getByRole('textbox', { name: /password/i }).first();
            if (await pw.isVisible().catch(() => false)) {
              await pw.focus();
              await pw.click();
              console.log('   → Password field (frame) focused.');
              return;
            }
          } catch {
            /* ignore */
          }
        }
      }
    };
    void focusPasswordWhenReady();

    const profileButton = page.getByRole('button', { name: PROFILE_NAME }).first();
    await profileButton.waitFor({ state: 'visible', timeout: 180_000 });

    await delay(SETUP_POST_PROFILE_MS);

    const storagePath = path.join(STORAGE_DIR, `auth-${site}.json`);
    await context.storageState({ path: storagePath });
    console.log(`✅ Auth state saved to ${storagePath}\n`);
  } catch (error) {
    console.error(`❌ Manual setup failed:`, error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function main() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  const env = (process.env.ENV || 'prod') as Env;

  try {
    await setupAuthManual(env, 'parts');
    await setupAuthManual(env, 'accessories');
    console.log('✅ Manual auth setup complete for both sites!');
    console.log('Run: npx playwright test\n');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
