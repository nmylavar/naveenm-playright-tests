/**
 * Auth page: login (uses project baseURL via page.goto('/')), "already logged in" check, banner dismiss, logout.
 * Retries goto once on network errors (e.g. ERR_HTTP2_PROTOCOL_ERROR). Credentials from data/credentials.json.
 */
import { Page, expect } from '@playwright/test';
import credentials from '../data/credentials.json';
import type { Env, Site } from '../utils/envUtils';
import { dismissBanner } from '../utils/banner.util';
import {
  NAV_TIMEOUT_MS,
  AUTH_GOTO_RETRY_MS,
  AUTH_POLL_MS,
  AUTH_POLL_DEADLINE_MS,
  AUTH_AFTER_CLICK_MS,
  AUTH_MODAL_WAIT_MS,
  AUTH_PROFILE_VISIBLE_MS,
  AUTH_SIGNOUT_VISIBLE_MS,
  AUTH_SIGNIN_BUTTON_MS,
  AUTH_BLOCKING_MODAL_MS,
  STEP_TIMEOUT_MS,
  OPTION_VISIBILITY_MS,
} from '../constants/waits';

/** Expected profile button text after login (e.g. user first name). Set in data/credentials.json as profileName. */
const profileName = (credentials as { username?: string; password?: string; profileName?: string }).profileName ?? 'My Account';

export class AuthPage {
  constructor(private readonly page: Page) {}

  private async safeWait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async isLoggedIn(): Promise<boolean> {
    return (
      (await this.profileButton.isVisible().catch(() => false)) ||
      (await this.signOutBtn.isVisible().catch(() => false)) ||
      (await this.profileAny.isVisible().catch(() => false))
    );
  }

  /** My Account trigger – try multiple structures (button > a, button, or link). */
  get myAccountButtonWithLink() {
    return this.page.getByRole('button', { name: 'My Account' }).locator('a');
  }
  get myAccountButton() {
    return this.page.getByRole('button', { name: 'My Account' });
  }
  get myAccountLink() {
    return this.page.getByRole('link', { name: 'My Account' });
  }
  get myAccountAny() {
    return this.page.getByRole('button', { name: 'My Account' }).first();
  }
  /** Sign In text in dropdown (click to open login form). */
  get signInText() {
    return this.page.getByText('Sign In');
  }
  get emailInput() {
    return this.page.getByRole('textbox', { name: 'Email' });
  }
  get continueBtn() {
    return this.page.getByRole('button', { name: 'Continue' });
  }
  get passwordInput() {
    return this.page.getByRole('textbox', { name: 'Password' });
  }
  /** Login submit button – GM form shows "Log In" (not "Sign in"). Support both. */
  /** Submit button may have id="continue" on password step. */
  get signInBtnById() {
    return this.page.locator('#continue');
  }
  /** Log In / Sign in button (GM form uses "Log In"). */
  get signInBtn() {
    return this.page.getByRole('button', { name: 'Log In' }).first().or(this.page.getByRole('button', { name: 'Sign in' }).first());
  }
  get signInPrimaryBtn() {
    return this.page.locator('button.gb-primary-button.chevy-primary-button').filter({ hasText: /Log In|Sign in/i });
  }
  /** After login, header shows user name as a button. */
  get profileButton() {
    return this.page.getByRole('button', { name: profileName });
  }
  /** Flexible: button or link containing profile name (header can vary). */
  get profileAny() {
    return this.page.getByRole('button', { name: new RegExp(profileName, 'i') }).first()
      .or(this.page.getByText(profileName, { exact: true }).first())
      .or(this.page.getByRole('link', { name: new RegExp(profileName, 'i') }).first());
  }
  get signOutBtn() {
    return this.page.getByRole('button', { name: 'Sign Out' });
  }
  /** Post-login modal container that may appear. */
  get modalContainer() {
    return this.page.locator('#modal-container');
  }

  /** Check if any modal/dialog is blocking interactions. */
  get blockingModal() {
    return this.page.locator('.modal.show, [role="dialog"].show, .fade.modal.show').first();
  }

  /** Click via JavaScript (bypasses overlays / "element intercepts" in Playwright browser). */
  private async clickSignInViaJs(): Promise<boolean> {
    const clicked = await this.page.evaluate(() => {
      const byId = document.querySelector('#continue') as HTMLButtonElement | null;
      if (byId) {
        byId.click();
        return true;
      }
      const buttons = Array.from(document.querySelectorAll('button'));
      const text = (b: Element) => (b.textContent || '').trim();
      const label = (b: Element) => (b.getAttribute('aria-label') || '').toLowerCase();
      const loginBtn = buttons.find(
        (b) =>
          /(log\s*in|sign\s*in)/i.test(text(b)) ||
          label(b) === 'log in' ||
          label(b) === 'sign in'
      );
      if (loginBtn) {
        (loginBtn as HTMLButtonElement).click();
        return true;
      }
      return false;
    });
    return clicked;
  }

  /** Try to click the Sign in submit button with multiple selectors and force click fallback. */
  private async clickSignInButton(): Promise<boolean> {
    const options = { timeout: AUTH_SIGNIN_BUTTON_MS };
    const tryClick = async (locator: ReturnType<Page['locator']>) => {
      if (await locator.isVisible().catch(() => false)) {
        try {
          await locator.click(options);
          return true;
        } catch {
          try {
            await locator.click({ ...options, force: true });
            return true;
          } catch {
            return false;
          }
        }
      }
      return false;
    };

    if (await tryClick(this.signInBtnById)) return true;
    if (await tryClick(this.signInBtn)) return true;
    if (await tryClick(this.signInPrimaryBtn)) return true;
    if (await this.clickSignInViaJs()) return true;
    return false;
  }

  /** Dismiss promo modal so header (My Account) is visible. */
  async closeAllBanners() {
    await dismissBanner(this.page);
  }

  /**
   * Ensure user is logged in. Uses the project's baseURL (parts or accessories) so the correct site is loaded.
   * If saved session is active, returns; otherwise runs Sign In flow.
   * Retries goto once on network errors (e.g. ERR_HTTP2_PROTOCOL_ERROR).
   */
  async login(_env?: Env, _site?: Site) {
    const gotoOpts = { waitUntil: 'domcontentloaded' as const, timeout: NAV_TIMEOUT_MS };
    try {
      await this.page.goto('/', gotoOpts);
    } catch {
      await this.safeWait(AUTH_GOTO_RETRY_MS);
      await this.page.goto('/', gotoOpts);
    }
    await this.page.waitForLoadState('load').catch(() => {});

    await this.closeAllBanners();
    await this.safeWait(AUTH_AFTER_CLICK_MS);

    const deadline = Date.now() + AUTH_POLL_DEADLINE_MS;
    while (Date.now() < deadline) {
      if (await this.isLoggedIn()) return;
      await this.safeWait(AUTH_POLL_MS);
    }

    const blockingModal = this.blockingModal;
    await blockingModal.waitFor({ state: 'hidden', timeout: AUTH_BLOCKING_MODAL_MS }).catch(() => {});
    await this.safeWait(AUTH_AFTER_CLICK_MS);
    await this.closeAllBanners();
    await blockingModal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    let clicked = false;
    if (await this.myAccountButtonWithLink.isVisible().catch(() => false)) {
      try {
        await this.myAccountButtonWithLink.click({ timeout: STEP_TIMEOUT_MS });
        clicked = true;
      } catch {
        await this.myAccountButtonWithLink.click({ force: true, timeout: OPTION_VISIBILITY_MS }).catch(() => {});
        clicked = true;
      }
    }
    if (!clicked && (await this.myAccountButton.isVisible().catch(() => false))) {
      await this.myAccountButton.click({ timeout: STEP_TIMEOUT_MS });
    } else if (!clicked && (await this.myAccountLink.isVisible().catch(() => false))) {
      await this.myAccountLink.click({ timeout: STEP_TIMEOUT_MS });
    } else if (!clicked && (await this.myAccountAny.isVisible().catch(() => false))) {
      await this.myAccountAny.click({ timeout: STEP_TIMEOUT_MS, force: true });
    }
    if (await this.isLoggedIn()) return;

    await this.signInText.waitFor({ state: 'visible', timeout: STEP_TIMEOUT_MS });
    await this.signInText.click();

    await this.emailInput.fill(credentials.username);
    await this.continueBtn.click();

    await this.passwordInput.waitFor({ state: 'visible', timeout: STEP_TIMEOUT_MS }).catch(() => {});
    await this.passwordInput.fill(credentials.password);

    const signInClicked = await this.clickSignInButton();
    if (!signInClicked) await this.passwordInput.press('Enter');

    await this.safeWait(AUTH_AFTER_CLICK_MS);

    if (await this.modalContainer.isVisible().catch(() => false)) {
      await this.modalContainer.click();
      await this.safeWait(AUTH_MODAL_WAIT_MS);
    }
    await this.closeAllBanners();

    await expect(this.profileButton).toBeVisible({ timeout: AUTH_PROFILE_VISIBLE_MS });
  }

  async logout() {
    await this.profileButton.locator('a').click();
    await this.signOutBtn.click();
    await expect(this.signInText).toBeVisible({ timeout: AUTH_SIGNOUT_VISIBLE_MS });
  }
}