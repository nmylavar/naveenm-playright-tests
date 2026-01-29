/**
 * Centralized timeouts and delays for the framework.
 * Use these constants instead of hardcoded values so tuning is in one place.
 */

/** Navigation: page load / goto. */
export const NAV_TIMEOUT_MS = 30_000;

/** General action timeout (click, fill). */
export const ACTION_TIMEOUT_MS = 15_000;

/** Short step timeout (dropdown click, option select). */
export const STEP_TIMEOUT_MS = 10_000;

/** Visibility / assertion timeout (e.g. "element visible"). */
export const VISIBILITY_TIMEOUT_MS = 15_000;

/** Shorter visibility for dropdown options. */
export const OPTION_VISIBILITY_MS = 5_000;

/** Banner dismiss: wait for close button and post-dismiss settle. */
export const BANNER_CLOSE_TIMEOUT_MS = 10_000;
export const BANNER_AFTER_CLICK_MS = 600;
export const BANNER_AFTER_FALLBACK_MS = 500;
export const BANNER_AFTER_ESCAPE_MS = 300;
export const BANNER_FINAL_SETTLE_MS = 400;

/** Vehicle flow: delay after opening Add Vehicle / between dropdown steps. */
export const VEHICLE_AFTER_ADD_BTN_MS = 300;
export const VEHICLE_AFTER_YEAR_MS = 300;
export const VEHICLE_AFTER_MODEL_MS = 500;
export const VEHICLE_AFTER_BODY_MS = 400;
export const VEHICLE_AFTER_BODY_SKIP_MS = 300;
export const VEHICLE_PAGE_READY_SETTLE_MS = 400;
export const VEHICLE_CATEGORIES_URL_TIMEOUT_MS = 15_000;

/** Auth: retry delay after failed goto; short poll/settle. */
export const AUTH_GOTO_RETRY_MS = 2_000;
export const AUTH_POLL_MS = 400;
export const AUTH_POLL_DEADLINE_MS = 8_000;
export const AUTH_AFTER_CLICK_MS = 500;
export const AUTH_MODAL_WAIT_MS = 300;
export const AUTH_PROFILE_VISIBLE_MS = 15_000;
export const AUTH_SIGNOUT_VISIBLE_MS = 10_000;
export const AUTH_SIGNIN_BUTTON_MS = 8_000;
export const AUTH_BLOCKING_MODAL_MS = 5_000;

/** Home: verify loaded, vehicle present/removed, search complete. */
export const HOME_LOADED_MS = 15_000;
export const HOME_VEHICLE_MS = 10_000;
export const HOME_SEARCH_COMPLETE_MS = 10_000;

/** Setup scripts (manual auth): post-goto and post-login settle. */
export const SETUP_POST_GOTO_MS = 2_000;
export const SETUP_POST_PROFILE_MS = 2_000;
