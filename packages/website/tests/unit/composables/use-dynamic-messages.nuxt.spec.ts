import { get } from '@vueuse/shared';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '~~/tests/mocks/server';
import { useDynamicMessages } from '~/composables/use-dynamic-messages';

const now = Math.floor(Date.now() / 1000);

describe('useDynamicMessages', () => {
  it('reads the messages from the Go server and converts their keys', async () => {
    server.use(http.get('*/api/messages/dashboard', () => HttpResponse.json([{
      action: { text: 'Donate', url: 'https://example.com' },
      message: 'Enjoying rotki?',
      message_highlight: 'Support us',
      period: { end: now + 3600, start: now - 3600 },
    }])));

    const { activeDashboardMessages, fetchMessages } = useDynamicMessages();
    await fetchMessages();

    expect(get(activeDashboardMessages)).toEqual([{
      action: { text: 'Donate', url: 'https://example.com' },
      message: 'Enjoying rotki?',
      messageHighlight: 'Support us',
      period: { end: now + 3600, start: now - 3600 },
    }]);
  });

  it('keeps messages that have not started yet hidden', async () => {
    server.use(http.get('*/api/messages/dashboard', () => HttpResponse.json([
      { message: 'Later', period: { end: now + 7200, start: now + 3600 } },
    ])));

    const { activeDashboardMessages, fetchMessages } = useDynamicMessages();
    await fetchMessages();

    expect(get(activeDashboardMessages)).toEqual([]);
  });

  it('shows nothing when the server has no messages to give', async () => {
    server.use(http.get('*/api/messages/dashboard', () => new HttpResponse('Messages unavailable', { status: 503 })));

    const { activeDashboardMessages, fetchMessages } = useDynamicMessages();
    await fetchMessages();

    expect(get(activeDashboardMessages)).toEqual([]);
  });
});
