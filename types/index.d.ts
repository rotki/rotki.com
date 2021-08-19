export interface ApiResponse<T> {
  readonly result: T | null
  readonly message: string
}

export interface Account {
  readonly username: string
  readonly github_username: string
  readonly api_key: string
  readonly api_secret: string
  readonly can_use_premium: boolean
  readonly address: Address
  readonly vat: number
  readonly has_active_subscription: boolean
  readonly subscriptions: Subscription[]
  readonly payments: Payment[]
  readonly date_now: string
}

export interface Address {
  readonly first_name: string
  readonly last_name: string
  readonly company_name: string
  readonly address_1: string
  readonly address_2: string
  readonly city: string
  readonly postcode: string
  readonly country: string
  readonly vat_id: string
  readonly moved_offline: boolean
}

export interface Subscription {
  readonly payment_provider: string
  readonly plan_name: string
  readonly duration_in_months: number
  readonly status: string
  readonly created_date: string
  readonly last_action_date: string
  readonly next_action_date: string
  readonly external_id: string
  readonly vat: string
  readonly currency: string
  readonly next_billing_amount: string
  readonly user: string
}

export interface Payment {
  readonly payment_provider: string
  readonly item_name: string
  readonly subscription: string
  readonly created_at: string
  readonly currency: string
  readonly amount: string
  readonly eur_amount: string
  readonly vat: string
  readonly external_id: string
  readonly address_details: number
}
