import { describe, expect, it } from 'vitest';
import { buildRequestHeaders, isMutationMethod } from '~/composables/use-fetch-with-csrf';

describe('isMutationMethod', () => {
  it.each(['post', 'POST', 'put', 'PUT', 'delete', 'patch'])('treats %s as a mutation', (method) => {
    expect(isMutationMethod(method)).toBe(true);
  });

  it.each(['get', 'GET', 'head', 'options', ''])('treats %s as a non-mutation', (method) => {
    expect(isMutationMethod(method)).toBe(false);
  });

  it('treats an undefined method as a non-mutation', () => {
    expect(isMutationMethod(undefined)).toBe(false);
  });
});

describe('buildRequestHeaders', () => {
  it('sets JSON accept and content-type by default', () => {
    const headers = buildRequestHeaders(undefined, undefined, false);
    expect(headers.get('accept')).toBe('application/json');
    expect(headers.get('content-type')).toBe('application/json');
  });

  it('omits content-type for FormData bodies so the multipart boundary is preserved', () => {
    const headers = buildRequestHeaders(undefined, undefined, true);
    expect(headers.get('content-type')).toBeNull();
    expect(headers.get('accept')).toBe('application/json');
  });

  it('attaches the CSRF token when provided', () => {
    expect(buildRequestHeaders(undefined, 'tok-123', false).get('X-CSRFToken')).toBe('tok-123');
  });

  it('omits the CSRF header when no token is available', () => {
    expect(buildRequestHeaders(undefined, undefined, false).get('X-CSRFToken')).toBeNull();
  });

  it('merges caller-provided headers case-insensitively', () => {
    expect(buildRequestHeaders({ 'X-Custom': 'value' }, undefined, false).get('x-custom')).toBe('value');
  });

  it('lets the resolved token win over a caller-provided CSRF header', () => {
    const headers = buildRequestHeaders({ 'x-csrftoken': 'stale' }, 'fresh', false);
    expect(headers.get('X-CSRFToken')).toBe('fresh');
  });

  it('does not duplicate the CSRF header when re-run over previously-built headers (retry path)', () => {
    const first = buildRequestHeaders(undefined, 'tok', false);
    const retried = buildRequestHeaders(first, 'tok', false);
    // A naive merge would collapse X-CSRFToken + x-csrftoken into "tok, tok".
    expect(retried.get('X-CSRFToken')).toBe('tok');
  });
});
