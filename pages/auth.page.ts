/**
 * Auth page: login (uses project baseURL via page.goto('/')), "already logged in" check, banner dismiss, logout.
 * Retries goto once on network errors (e.g. ERR_HTTP2_PROTOCOL_ERROR). Credentials from data/credentials.json.
 */
import { Page, expect } from '@playwright/test';
import credentials from '../data/credentials.json';
import type { Env, Site } from '../utils/envUtils';
import { dismissBanner } from '../utils/banner.util';

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
  get signInBtn() {
    return this.page.getByRole('button', { name: 'Log In' }).first().or(this.page.getByRole('button', { name: 'Sign in' }).first());
  }
  get signInBtnLogIn() {
    return this.page.getByRole('button', { name: 'Log In' }).first();
  }
  get signInBtnByLabel() {
    return this.page.getByLabel('Log In', { exact: true }).or(this.page.getByLabel('Sign in', { exact: true }));
  }
  /** Submit button may have id="continue" on password step. */
  get signInBtnById() {
    return this.page.locator('#continue');
  }
  get signInBtnByText() {
    return this.page.getByText('Log In', { exact: true }).first().or(this.page.getByText('Sign in', { exact: true }).first());
  }
  get signInSubmitInput() {
    return this.page.locator('input[type="submit"][value*="Sign"], input[type="submit"][value*="sign"], input[type="submit"][value*="Log"]').first();
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
    const options = { timeout: 8_000 };
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

    // Try "Log In" first (GM form uses this), then "Sign in"
    if (await tryClick(this.signInBtnLogIn)) return true;
    if (await tryClick(this.signInBtnByLabel)) return true;
    if (await tryClick(this.signInBtnById)) return true;
    if (await tryClick(this.signInBtn)) return true;
    if (await tryClick(this.signInBtnByText)) return true;
    if (await tryClick(this.signInSubmitInput)) return true;
    const loginPrimaryBtn = this.page.locator('button.gb-primary-button.chevy-primary-button').filter({ hasText: 'Log In' });
    if (await tryClick(loginPrimaryBtn)) return true;
    const signInPrimaryBtn = this.page.locator('button.gb-primary-button.chevy-primary-button').filter({ hasText: 'Sign in' });
    if (await tryClick(signInPrimaryBtn)) return true;

    // When Playwright's click is blocked (overlay / not stable), click via JavaScript
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
    const gotoOpts = { waitUntil: 'domcontentloaded' as const, timeout: 30_000 };
    try {
      await this.page.goto('/', gotoOpts);
    } catch (e) {
      await this.safeWait(2_000);
      await this.page.goto('/', gotoOpts);
    }
    await this.page.waitForLoadState('load').catch(() => {});

    await this.closeAllBanners();
    await this.safeWait(500);

    // 1. Check for successful authentication (saved session). Short poll so we don't burn test timeout.
    const pollMs = 400;
    const pollTimeoutMs = 8_000;
    const deadline = Date.now() + pollTimeoutMs;
    while (Date.now() < deadline) {
      if (await this.isLoggedIn()) {
        return; // Already authenticated; stay on page and continue. No Sign In flow.
      }
      await this.safeWait(pollMs);
    }

    // 2. Not logged in: proceed with full login flow (My Account → Sign In → credentials).
    const blockingModal = this.blockingModal;
    await blockingModal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    await this.safeWait(500);
    await this.closeAllBanners();
    await blockingModal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    // Click My Account to open dropdown
    let clicked = false;
    if (await this.myAccountButtonWithLink.isVisible().catch(() => false)) {
      try {
        await this.myAccountButtonWithLink.click({ timeout: 10_000 });
        clicked = true;
      } catch {
        await this.myAccountButtonWithLink.click({ force: true, timeout: 5_000 }).catch(() => {});
        clicked = true;
      }
    }
    if (!clicked && (await this.myAccountButton.isVisible().catch(() => false))) {
      await this.myAccountButton.click({ timeout: 10_000 });
    } else if (!clicked && (await this.myAccountLink.isVisible().catch(() => false))) {
      await this.myAccountLink.click({ timeout: 10_000 });
    } else if (!clicked && (await this.myAccountAny.isVisible().catch(() => false))) {
      await this.myAccountAny.click({ timeout: 10_000, force: true });
    }
    // If dropdown revealed we're already logged in (e.g. profile name visible), stop
    if (await this.isLoggedIn()) return;

    // Only when not logged in: wait for Sign In in dropdown and click to open login form
    await this.signInText.waitFor({ state: 'visible', timeout: 10_000 });
    await this.signInText.click();

    await this.emailInput.fill(credentials.username);
    await this.continueBtn.click();

    await this.passwordInput.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    await this.passwordInput.fill(credentials.password);
    
    // Submit login – try multiple selectors and force click / Enter as fallbacks
    const signInClicked = await this.clickSignInButton();
    if (!signInClicked) {
      // Last resort: press Enter in password field to submit form
      await this.passwordInput.press('Enter');
    }
    
    await this.safeWait(500);
    
    // Close any post-login modal (e.g. #modal-container)
    const modalContainer = this.modalContainer;
    if (await modalContainer.isVisible().catch(() => false)) {
      await modalContainer.click();
      await this.safeWait(300);
    }
    
    // Also try closing any remaining banners/modals
    await this.closeAllBanners();

    await expect(this.profileButton).toBeVisible({ timeout: 15_000 });
  }

  async logout() {
    await this.profileButton.locator('a').click();
    await this.signOutBtn.click();
    await expect(this.signInText).toBeVisible({ timeout: 10_000 });
  }
}