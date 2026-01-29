/**
 * Search E2E: login, verify home, type query in search bar, submit, wait for completion, assert input visible.
 * No-results test: search for unlikely query and assert search state (URL or input visible).
 */
import { test, expect } from '../fixtures/fixtures';

test('Search: home page search bar accepts input and submits', async ({ auth, home }) => {
  await auth.login();
  await home.verifyLoaded();

  await home.search('oil filter');
  await home.waitForSearchComplete();
  await expect(home.searchInput).toBeVisible();
});

test('Search: no-results query completes and search input remains visible', async ({ auth, home }) => {
  await auth.login();
  await home.verifyLoaded();

  await home.search('xyznonexistent999');
  await home.waitForSearchComplete();
  await expect(home.searchInput).toBeVisible();
});
