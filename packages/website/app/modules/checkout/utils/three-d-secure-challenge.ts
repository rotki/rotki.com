/** Where the pages using 3D Secure show the bank's challenge. */
const CHALLENGE_CONTAINER_ID = 'threeds-iframe-container';

/**
 * Shows the bank's challenge in the page. The frame is Braintree's wrapper around the bank's iframe:
 * the standard 500x600 window, narrower on phones. Returns whether the page had a place for it.
 */
export function mountChallengeFrame(frame: HTMLElement): boolean {
  frame.style.maxWidth = 'min(100%, 500px)';
  frame.style.minHeight = '400px';
  frame.style.border = 'none';
  frame.style.borderRadius = '8px';

  const container = typeof document === 'undefined' ? null : document.getElementById(CHALLENGE_CONTAINER_ID);
  if (!container)
    return false;

  container.innerHTML = '';
  container.appendChild(frame);
  return true;
}
