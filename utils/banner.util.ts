/**
 * Banner / promo modal utilities for Chevrolet sites.
 * - dismissBanner: wait for .q-close-modal-button, click (with force fallback), then try other close controls and Escape/backdrop.
 * - hideBannerByCss: inject CSS to hide common modals (backup when click is blocked).
 * Set BANNER_CLOSE_SELECTOR env var to override the primary close selector.
 */
import type { Page } from '@playwright/test';
import {
  BANNER_CLOSE_TIMEOUT_MS,
  BANNER_AFTER_CLICK_MS,
  BANNER_AFTER_FALLBACK_MS,
  BANNER_AFTER_ESCAPE_MS,
  BANNER_FINAL_SETTLE_MS,
  OPTION_VISIBILITY_MS,
} from '../constants/waits';

const BANNER_CLOSE_SELECTOR = process.env.BANNER_CLOSE_SELECTOR || '';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Dismiss promo modal: primary .q-close-modal-button, then fallbacks (MarketingPromoPopup, modal-header, Escape, backdrop). Call after goto() so the modal has time to render. */
export async function dismissBanner(page: Page): Promise<void> {
  const timeout = BANNER_CLOSE_TIMEOUT_MS;
  const clickTimeout = OPTION_VISIBILITY_MS;

  // 1. Assignment selector: .q-close-modal-button – wait for it and click
  const closeBtn = page.locator('.q-close-modal-button').first();
  try {
    await closeBtn.waitFor({ state: 'visible', timeout });
    await closeBtn.click({ timeout: clickTimeout }).catch(async () => {
      await closeBtn.click({ timeout: clickTimeout, force: true });
    });
    await delay(BANNER_AFTER_CLICK_MS);
  } catch {
    // continue to fallbacks
  }

  // 2. Custom env selector
  if (BANNER_CLOSE_SELECTOR) {
    const custom = page.locator(BANNER_CLOSE_SELECTOR).first();
    if (await custom.isVisible().catch(() => false)) {
      await custom.click({ timeout }).catch(() => {});
      await delay(BANNER_AFTER_FALLBACK_MS);
    }
  }

  // 3. Try other close controls
  const fallbacks = [
    () => page.locator('#MarketingPromoPopup .q-close-modal-button').first(),
    () =>
      page
        .locator(
          [
            '.modal-header .q-close-modal-button',
            '.modal-header button[aria-label="Close"]',
            '.modal-header button[aria-label="close"]',
            '.modal-header .close',
            '.modal-header svg',
            '.svg-inline--fa.fa-times-circle',
          ].join(', ')
        )
        .first(),
    () => page.getByRole('button', { name: /close|dismiss|x/i }).first(),
  ];
  for (const getLoc of fallbacks) {
    const el = getLoc();
    if (await el.isVisible().catch(() => false)) {
      await el.click({ timeout: clickTimeout }).catch(async () => {
        await el.click({ timeout: clickTimeout, force: true }).catch(() => {});
      });
      await delay(BANNER_AFTER_FALLBACK_MS);
      break;
    }
  }

  // 4. Escape + backdrop
  const modal = page.locator('.modal.show, [role="dialog"].show').first();
  if (await modal.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape').catch(() => {});
    await delay(BANNER_AFTER_ESCAPE_MS);
    await page
      .locator('.modal-backdrop, .modal-backdrop.show')
      .first()
      .click({ timeout: 2_000 })
      .catch(async () => {
        await page
          .locator('.modal-backdrop, .modal-backdrop.show')
          .first()
          .click({ timeout: 2_000, force: true })
          .catch(() => {});
      });
  }

  await delay(BANNER_FINAL_SETTLE_MS);
}

/**
 * Injects CSS to hide modals/backdrops on load (backup; primary is dismissBanner after goto).
 */
export function hideBannerByCss(page: Page): Promise<void> {
  return page.addInitScript(() => {
    const sel = '.modal.show, .modal-backdrop.show, #MarketingPromoPopup, [role="dialog"].modal.show, .fade.modal.show';
    const rule = `${sel} { display: none !important; visibility: hidden !important; pointer-events: none !important; }`;
    const id = 'playwright-hide-promo-banner';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = rule;
    document.documentElement.appendChild(style);
    document.querySelectorAll(sel).forEach((el) => {
      (el as HTMLElement).style.setProperty('display', 'none', 'important');
      (el as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
    });
    const root = document.body || document.documentElement;
    if (root) {
      const obs = new MutationObserver(() => {
        document.querySelectorAll(sel).forEach((el) => {
          (el as HTMLElement).style.setProperty('display', 'none', 'important');
          (el as HTMLElement).style.setProperty('pointer-events', 'none', 'important');
        });
      });
      obs.observe(root, { childList: true, subtree: true });
    }
  });
}
