export interface PasswordChangePayload {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly passwordConfirmation: string;
}

export interface ProfilePayload {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly companyName?: string;
  readonly vatId?: string;
  readonly address1?: string;
  readonly address2?: string;
  readonly city?: string;
  readonly postcode?: string;
  readonly country?: string;
}

export interface DeleteAccountPayload {
  username: string;
}

export enum VatIdStatus {
  NOT_CHECKED = 'Not checked',
  VALID = 'Valid',
  NOT_VALID = 'Not valid',
  NON_EU_ID = 'ID outside the EU',
}
