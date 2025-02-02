import { WalletCurrency } from "@app/graphql/generated"

export enum DisplayCurrency {
  BTC = "BTC",
  USD = "USD",
}

export type PaymentAmount<T extends WalletCurrency> = {
  amount: number
  currency: T
}
export type DisplayAmount<T extends DisplayCurrency> = {
  amount: number
  currency: T
}

export type BtcDisplayAmount = DisplayAmount<DisplayCurrency.BTC>
export type UsdDisplayAmount = DisplayAmount<DisplayCurrency.USD>

export type UsdPaymentAmount = PaymentAmount<"USD">
export type BtcPaymentAmount = PaymentAmount<"BTC">
