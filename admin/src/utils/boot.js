// Timing of the start screen (components/LoadingScreen.jsx), shared by AuthProvider and DataProvider.
// It fades in after SCREEN_DELAY_MS (global.css .loading-screen); when it was showing, 100 % stays up DONE_HOLD_MS.
export const SCREEN_DELAY_MS = 300
export const DONE_HOLD_MS = 400
// After this long without an answer the start screen says the server is being started
export const WAKE_HINT_MS = 3000
