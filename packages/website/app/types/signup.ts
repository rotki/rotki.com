export interface SignupAccountPayload {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
}

/** The second step: the name and address printed on invoices, plus the newsletter choice. */
export interface SignupInvoicePayload {
  readonly firstName: string;
  readonly lastName: string;
  readonly companyName: string;
  readonly vatId: string;
  readonly address1: string;
  readonly address2: string;
  readonly city: string;
  readonly postcode: string;
  readonly country: string;
  readonly newsletterConsent: boolean;
}

export interface SignupPayload extends SignupAccountPayload, SignupInvoicePayload {}
