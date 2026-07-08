import type { NftMetadataStatus } from '~/modules/web3/sponsorship/submission-state';
import { pipe } from 'plainfp';
import { err, ok } from 'plainfp/result';
import { flatMap, type ResultAsync } from 'plainfp/result-async';
import { tag, type Tagged } from 'plainfp/tagged';

/**
 * Ordered, dependency-injected holder-submission flow. Each step runs only after
 * the previous one succeeds — validate, then verify ownership, then build the
 * payload, then submit — so the outcome never depends on whether a watcher
 * happened to set an imperative flag first (the fresh-sign race). Every dependency
 * is passed in, so the whole flow is unit-testable without Vue or the network.
 */

/** Tagged failure union for a submit attempt. */
export type SubmitError =
  | Tagged<'ValidationFailed', object>
  | Tagged<'NftNotFound', object>
  | Tagged<'WrongRelease', object>
  | Tagged<'NotOwner', object>
  | Tagged<'OwnershipUnverified', object>
  | Tagged<'CheckFailed', object>
  | Tagged<'AuthRequired', object>
  | Tagged<'SubmitFailed', { message?: string }>;

export interface SubmitFlowDeps {
  /** Vuelidate `$validate()`; resolves true when the form passes. */
  validate: () => Promise<boolean>;
  /** Editing skips the live ownership gate — the backend re-verifies on submit. */
  isEditing: boolean;
  /** Runs the on-chain metadata/ownership check and resolves its status. */
  checkOwnership: () => Promise<NftMetadataStatus | undefined>;
  /** Assemble the multipart payload (pure). */
  buildPayload: () => FormData;
  /** Submit behind a valid SIWE session; rejects on failure. */
  submit: (payload: FormData) => Promise<void>;
}

/** Map an ownership status to the matching submit error (undefined status = inconclusive check). */
export function ownershipStatusToError(status: NftMetadataStatus | undefined): SubmitError | undefined {
  switch (status) {
    case 'ok':
      return undefined;
    case 'not_found':
      return tag('NftNotFound')({});
    case 'wrong_release':
      return tag('WrongRelease')({});
    case 'not_owner':
      return tag('NotOwner')({});
    case 'unverified':
      return tag('OwnershipUnverified')({});
    case undefined:
      return tag('CheckFailed')({});
  }
}

/** Translate a thrown submit error into the tagged union, preserving auth + backend messages. */
export function mapThrownSubmitError(cause: unknown): SubmitError {
  const message = cause instanceof Error ? cause.message : undefined;
  if (message?.includes('Authentication required'))
    return tag('AuthRequired')({});
  return tag('SubmitFailed')({ message: backendMessage(cause) ?? message });
}

/** Pull a `{ data: { message } }` string off a fetch error, if present. */
function backendMessage(cause: unknown): string | undefined {
  if (typeof cause !== 'object' || cause === null || !('data' in cause))
    return undefined;
  const data = cause.data;
  if (typeof data !== 'object' || data === null || !('message' in data))
    return undefined;
  return typeof data.message === 'string' ? data.message : undefined;
}

/**
 * Resolve the top-level error banner text for a failed submit. Validation and NFT
 * errors already surface inline / via the nftCheckError alert, so they return ''.
 * `translate` is the i18n `t` — injected so this stays pure and testable.
 */
export function submitErrorMessage(error: SubmitError, translate: (key: string) => string): string {
  switch (error._tag) {
    case 'ValidationFailed':
    case 'NftNotFound':
    case 'WrongRelease':
    case 'NotOwner':
    case 'CheckFailed':
      return '';
    case 'OwnershipUnverified':
      return translate('sponsor.submit_name.error.check_failed');
    case 'AuthRequired':
      return translate('sponsor.submit_name.error.sign_failed');
    case 'SubmitFailed':
      return error.message || translate('sponsor.submit_name.error.submit_failed');
  }
}

async function validateStep(validate: () => Promise<boolean>): ResultAsync<void, SubmitError> {
  return (await validate()) ? ok(undefined) : err(tag('ValidationFailed')({}));
}

async function ownershipStep(isEditing: boolean, checkOwnership: () => Promise<NftMetadataStatus | undefined>): ResultAsync<void, SubmitError> {
  if (isEditing)
    return ok(undefined);

  const error = ownershipStatusToError(await checkOwnership());
  return error ? err(error) : ok(undefined);
}

async function submitStep(buildPayload: () => FormData, submit: (payload: FormData) => Promise<void>): ResultAsync<void, SubmitError> {
  try {
    await submit(buildPayload());
    return ok(undefined);
  }
  catch (error) {
    return err(mapThrownSubmitError(error));
  }
}

/** Run the whole submit flow, short-circuiting on the first failing step. */
export async function runSubmitFlow(deps: SubmitFlowDeps): ResultAsync<void, SubmitError> {
  return pipe(
    validateStep(deps.validate),
    flatMap(async () => ownershipStep(deps.isEditing, deps.checkOwnership)),
    flatMap(async () => submitStep(deps.buildPayload, deps.submit)),
  );
}
