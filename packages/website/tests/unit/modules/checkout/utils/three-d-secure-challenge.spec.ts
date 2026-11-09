import { afterEach, describe, expect, it } from 'vitest';
import { mountChallengeFrame } from '~/modules/checkout/utils/three-d-secure-challenge';

describe('mountChallengeFrame', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('replaces what the container holds with the frame, at the standard width', () => {
    document.body.innerHTML = '<div id="threeds-iframe-container"><p>old</p></div>';
    const frame = document.createElement('div');

    expect(mountChallengeFrame(frame)).toBe(true);

    const container = document.getElementById('threeds-iframe-container');
    expect(container?.children).toHaveLength(1);
    expect(container?.firstElementChild).toBe(frame);
    expect(frame.style.maxWidth).toBe('min(100%, 500px)');
  });

  it('says so when the page has no place for it', () => {
    expect(mountChallengeFrame(document.createElement('div'))).toBe(false);
  });
});
