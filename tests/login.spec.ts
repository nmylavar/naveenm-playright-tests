/**
 * Login E2E: ensure user is logged in (saved state or full flow), then assert profile visible.
 */
import { test, expect } from '../fixtures/fixtures';

test('Login Test', async ({ auth }) => {
  await auth.login();
  await expect(auth.profileButton).toBeVisible();
});

