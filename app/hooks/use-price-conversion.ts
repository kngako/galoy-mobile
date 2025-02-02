import {
  CurrentPriceDocument,
  WalletCurrency,
  useCurrentPriceQuery,
} from "@app/graphql/generated"
import { PaymentAmount, UsdPaymentAmount } from "@app/types/amounts"
import * as React from "react"

export const usePriceConversion = () => {
  const { data } = useCurrentPriceQuery({
    query: CurrentPriceDocument,
    fetchPolicy: "cache-only",
  })

  const price = Number(data?.btcPrice?.formattedAmount ?? NaN)

  const convertCurrencyAmount = React.useCallback(
    ({
      amount,
      from,
      to,
    }: {
      amount: number
      from: "USD" | "BTC"
      to: "USD" | "BTC"
    }) => {
      if (from === "BTC" && to === "USD") {
        return (amount * price) / 100
      }
      if (from === "USD" && to === "BTC") {
        return (100 * amount) / price
      }
      return amount
    },
    [price],
  )

  const convertPaymentAmount = React.useCallback(
    <T extends WalletCurrency>(
      paymentAmount: PaymentAmount<WalletCurrency>,
      toCurrency: T,
    ): PaymentAmount<T> => {
      if (!price) {
        return {
          amount: NaN,
          currency: toCurrency,
        }
      }

      if (
        paymentAmount.currency === WalletCurrency.Btc &&
        toCurrency === WalletCurrency.Usd
      ) {
        return {
          amount: Math.round(paymentAmount.amount * price),
          currency: toCurrency,
        }
      }

      if (
        paymentAmount.currency === WalletCurrency.Usd &&
        toCurrency === WalletCurrency.Btc
      ) {
        return {
          amount: Math.round(paymentAmount.amount / price),
          currency: toCurrency,
        }
      }

      return {
        amount: Math.round(paymentAmount.amount),
        currency: toCurrency,
      }
    },
    [price],
  )

  return {
    convertCurrencyAmount,
    convertPaymentAmount,
    usdPerBtc: {
      currency: WalletCurrency.Usd,
      amount: price ? price * 100000000 : NaN,
    } as UsdPaymentAmount,
    usdPerSat: price ? (price / 100).toFixed(8) : null,
  }
}
