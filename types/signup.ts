export interface SignupPayload {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly companyName: string;
  readonly address1: string;
  readonly address2: string;
  readonly city: string;
  readonly country: string;
  readonly postcode: string;
  readonly githubUsername: string;
  readonly vatId: string;
}
