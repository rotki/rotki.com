import { ApiError } from '~/types/index'

export type DataTableHeader = {
  readonly text: string
  readonly value: string
  readonly className?: string
  readonly sortable?: boolean
}

export type ActionResult = {
  readonly success: boolean
  readonly message?: ApiError
}
