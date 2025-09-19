export interface SignupAccountPayload {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
}

export interface SignupCustomerInformationPayload {
  readonly firstName: string;
  readonly lastName: string;
  readonly companyName: string;
  readonly vatId: string;
}

export interface SignupAddressPayload {
  readonly address1: string;
  readonly address2: string;
  readonly city: string;
  readonly postcode: string;
  readonly country: string;
}

export interface SignupPayload
  extends SignupAccountPayload,
  SignupCustomerInformationPayload,
  SignupAddressPayload {}
