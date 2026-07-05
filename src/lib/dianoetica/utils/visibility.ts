/**
 * Pause/resume callbacks tied to Page Visibility API.
 * Returns a teardown function.
 */
export function setupVisibilityPause(onHide: () => void, onShow: () => void): () => void {
  const handler = () => {
    if (document.visibilityState === 'hidden') onHide()
    else onShow()
  }
  document.addEventListener('visibilitychange', handler)
  return () => document.removeEventListener('visibilitychange', handler)
}
