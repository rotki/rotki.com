/* eslint-disable camelcase */
export interface SignupPayload {
  readonly username: string
  readonly email: string
  readonly password: string
  readonly confirm_password: string
  readonly firstname: string
  readonly lastname: string
  readonly companyname: string
  readonly address_1: string
  readonly address_2: string
  readonly city: string
  readonly country: string
  readonly postcode: string
  readonly github_username: string
  readonly vat_id: string
}
