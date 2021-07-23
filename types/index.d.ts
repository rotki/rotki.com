export interface ApiResponse<T> {
  readonly result: T | null
  readonly message: string
}
