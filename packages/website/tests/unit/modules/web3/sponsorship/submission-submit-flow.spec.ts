import type { NftMetadataStatus } from '~/modules/web3/sponsorship/submission-state';
import { describe, expect, it } from 'vitest';
import { mapThrownSubmitError, ownershipStatusToError, runSubmitFlow, type SubmitError, type SubmitFlowDeps } from '~/modules/web3/sponsorship/submission-submit-flow';

interface Behaviour {
  validate?: boolean;
  ownership?: NftMetadataStatus | undefined;
  isEditing?: boolean;
  submit?: () => void;
}

// Each dependency records its own name in `calls`, so a test can assert the exact
// execution order and that later steps never run once an earlier one fails.
function makeDeps(behaviour: Behaviour = {}): { deps: SubmitFlowDeps; calls: string[] } {
  const calls: string[] = [];
  const deps: SubmitFlowDeps = {
    buildPayload: () => {
      calls.push('build');
      return new FormData();
    },
    checkOwnership: async () => {
      calls.push('ownership');
      // `in` so an explicit `ownership: undefined` (inconclusive check) is honoured.
      return 'ownership' in behaviour ? behaviour.ownership : 'ok';
    },
    isEditing: behaviour.isEditing ?? false,
    submit: async () => {
      calls.push('submit');
      behaviour.submit?.();
    },
    validate: async () => {
      calls.push('validate');
      return behaviour.validate ?? true;
    },
  };
  return { calls, deps };
}

function tagOf(error: SubmitError): string {
  return error._tag;
}

describe('runSubmitFlow', () => {
  it('runs the steps in order: validate -> ownership -> build -> submit', async () => {
    const { calls, deps } = makeDeps();

    const result = await runSubmitFlow(deps);

    expect(result.ok).toBe(true);
    expect(calls).toEqual(['validate', 'ownership', 'build', 'submit']);
  });

  it('stops at validation and touches nothing else when the form is invalid', async () => {
    const { calls, deps } = makeDeps({ validate: false });

    const result = await runSubmitFlow(deps);

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : tagOf(result.error)).toBe('ValidationFailed');
    expect(calls).toEqual(['validate']);
  });

  it('stops at ownership (never builds or submits) when the wallet is not the owner', async () => {
    const { calls, deps } = makeDeps({ ownership: 'not_owner' });

    const result = await runSubmitFlow(deps);

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : tagOf(result.error)).toBe('NotOwner');
    expect(calls).toEqual(['validate', 'ownership']);
  });

  it('treats an inconclusive ownership check as CheckFailed', async () => {
    const { deps } = makeDeps({ ownership: undefined });

    const result = await runSubmitFlow(deps);

    expect(result.ok ? undefined : tagOf(result.error)).toBe('CheckFailed');
  });

  it('skips the ownership check entirely when editing', async () => {
    const { calls, deps } = makeDeps({ isEditing: true });

    const result = await runSubmitFlow(deps);

    expect(result.ok).toBe(true);
    expect(calls).toEqual(['validate', 'build', 'submit']);
  });

  it('maps an authentication failure from submit to AuthRequired', async () => {
    const { deps } = makeDeps({
      submit: () => {
        throw new Error('Authentication required. Please sign the message to continue.');
      },
    });

    const result = await runSubmitFlow(deps);

    expect(result.ok ? undefined : tagOf(result.error)).toBe('AuthRequired');
  });

  it('surfaces a backend error message as SubmitFailed', async () => {
    const { deps } = makeDeps({
      submit: () => {
        throw Object.assign(new Error('500'), { data: { message: 'Name already taken' } });
      },
    });

    const result = await runSubmitFlow(deps);

    expect(result).toStrictEqual({ error: { _tag: 'SubmitFailed', message: 'Name already taken' }, ok: false });
  });
});

describe('ownershipStatusToError', () => {
  it.each<[NftMetadataStatus, string | undefined]>([
    ['ok', undefined],
    ['not_found', 'NftNotFound'],
    ['wrong_release', 'WrongRelease'],
    ['not_owner', 'NotOwner'],
    ['unverified', 'OwnershipUnverified'],
  ])('maps %s -> %s', (status, expected) => {
    expect(ownershipStatusToError(status)?._tag).toBe(expected);
  });

  it('maps a missing status to CheckFailed', () => {
    expect(ownershipStatusToError(undefined)?._tag).toBe('CheckFailed');
  });
});

describe('mapThrownSubmitError', () => {
  it('recognises the auth-required sentinel', () => {
    expect(mapThrownSubmitError(new Error('Authentication required'))._tag).toBe('AuthRequired');
  });

  it('prefers a backend data.message', () => {
    expect(mapThrownSubmitError({ data: { message: 'boom' } })).toStrictEqual({ _tag: 'SubmitFailed', message: 'boom' });
  });

  it('falls back to the Error message', () => {
    expect(mapThrownSubmitError(new Error('network down'))).toStrictEqual({ _tag: 'SubmitFailed', message: 'network down' });
  });
});
