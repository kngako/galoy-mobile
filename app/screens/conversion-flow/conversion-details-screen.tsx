import { Button } from "@rneui/base"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, Platform, Text, View } from "react-native"
import { FakeCurrencyInput } from "react-native-currency-input"
import EStyleSheet from "react-native-extended-stylesheet"
import { ScrollView, TouchableWithoutFeedback } from "react-native-gesture-handler"

import SwitchButton from "@app/assets/icons/transfer.svg"
import { WalletCurrency, useConversionScreenQuery } from "@app/graphql/generated"
import { usePriceConversion } from "@app/hooks"
import { useUsdBtcAmount } from "@app/hooks/use-amount"
import { useDisplayCurrency } from "@app/hooks/use-display-currency"
import { useI18nContext } from "@app/i18n/i18n-react"
import { RootStackParamList } from "@app/navigation/stack-param-lists"
import { color, palette } from "@app/theme"
import {
  paymentAmountToDollarsOrSats,
  satAmountDisplay,
} from "@app/utils/currencyConversion"
import { StackScreenProps } from "@react-navigation/stack"

export const ConversionDetailsScreen = ({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, "conversionDetails">) => {
  const { data } = useConversionScreenQuery({
    fetchPolicy: "cache-first",
    returnPartialData: true,
  })

  const { usdPerBtc, convertCurrencyAmount } = usePriceConversion()
  const [fromWalletCurrency, setFromWalletCurrency] = useState<WalletCurrency>(
    WalletCurrency.Btc,
  )
  const {
    usdAmount,
    btcAmount,
    setAmountsWithUsd,
    setAmountsWithBtc,
    paymentAmount,
    setPaymentAmount,
  } = useUsdBtcAmount(route.params?.transferAmount)
  const [amountFieldError, setAmountFieldError] = useState<string>()
  const [activeCurrencyInput, setActiveCurrencyInput] = useState<WalletCurrency>(
    WalletCurrency.Usd,
  )
  const { LL } = useI18nContext()
  const { formatToDisplayCurrency } = useDisplayCurrency()

  useEffect(() => {
    if (!data?.me?.defaultAccount) {
      return
    }

    const btcWallet = data.me.defaultAccount.btcWallet
    const usdWallet = data.me.defaultAccount.usdWallet

    const btcWalletBalance = btcWallet?.balance ?? NaN
    const usdWalletBalance = usdWallet?.balance ?? NaN

    if (fromWalletCurrency === WalletCurrency.Btc) {
      if (btcAmount.amount > btcWalletBalance) {
        setAmountFieldError(
          LL.SendBitcoinScreen.amountExceed({
            balance: satAmountDisplay(btcWalletBalance),
          }),
        )
      } else {
        setAmountFieldError(undefined)
      }
    }

    if (fromWalletCurrency === WalletCurrency.Usd) {
      if (usdAmount.amount > usdWalletBalance) {
        setAmountFieldError(
          LL.SendBitcoinScreen.amountExceed({
            balance: formatToDisplayCurrency(usdWalletBalance / 100),
          }),
        )
      } else {
        setAmountFieldError(undefined)
      }
    }
  }, [
    btcAmount,
    usdAmount,
    fromWalletCurrency,
    data?.me?.defaultAccount,
    LL,
    formatToDisplayCurrency,
  ])

  useEffect(() => {
    if (!fromWalletCurrency) return

    if (fromWalletCurrency === WalletCurrency.Usd) {
      setActiveCurrencyInput(WalletCurrency.Usd)
    }
  }, [fromWalletCurrency])

  const switchWallets = () => {
    setAmountFieldError(undefined)
    setPaymentAmount({ amount: 0, currency: WalletCurrency.Usd })

    fromWalletCurrency === WalletCurrency.Btc
      ? setFromWalletCurrency(WalletCurrency.Usd)
      : setFromWalletCurrency(WalletCurrency.Btc)
  }

  const toggleActiveCurrencyInput = () => {
    setActiveCurrencyInput(
      activeCurrencyInput === WalletCurrency.Usd
        ? WalletCurrency.Btc
        : WalletCurrency.Usd,
    )
  }

  if (!data?.me?.defaultAccount) {
    // TODO: proper error handling. non possible event?
    return <></>
  }

  const btcWallet = data.me.defaultAccount.btcWallet
  const usdWallet = data.me.defaultAccount.usdWallet

  const btcWalletBalance = btcWallet?.balance ?? NaN
  const usdWalletBalance = usdWallet?.balance ?? NaN

  const setAmountToBalancePercentage = (percentage: number) => {
    if (fromWalletCurrency === WalletCurrency.Btc) {
      setAmountsWithBtc(Math.floor((btcWalletBalance * percentage) / 100))
      setActiveCurrencyInput(WalletCurrency.Btc)
    }
    if (fromWalletCurrency === WalletCurrency.Usd) {
      setAmountsWithUsd(Math.floor((usdWalletBalance * percentage) / 100))
      setActiveCurrencyInput(WalletCurrency.Usd)
    }
  }

  const isButtonEnabled = () => {
    if (paymentAmount.amount === 0) return false

    if (
      fromWalletCurrency === WalletCurrency.Btc &&
      btcAmount.amount <= btcWalletBalance
    ) {
      return true
    }
    if (
      fromWalletCurrency === WalletCurrency.Usd &&
      usdAmount.amount <= usdWalletBalance
    ) {
      return true
    }

    return false
  }

  const moveToNextScreen = () => {
    navigation.navigate("conversionConfirmation", {
      fromWalletCurrency,
      usdAmount,
      btcAmount,
      usdPerBtc,
    })
  }

  // FIXME: this one (fromWalletCurrency) is always available. is there another one that is relevant?
  if (!fromWalletCurrency) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    )
  }

  const toWalletCurrency =
    fromWalletCurrency === WalletCurrency.Btc ? WalletCurrency.Usd : WalletCurrency.Btc

  const btcWalletValueInUsd = convertCurrencyAmount({
    amount: btcWalletBalance,
    from: "BTC",
    to: "USD",
  })

  return (
    <ScrollView style={styles.transferScreenContainer}>
      <View style={styles.fieldContainer}>
        <View style={styles.fromFieldContainer}>
          <View style={styles.fieldLabelContainer}>
            <Text style={styles.fieldLabel}>{LL.common.from()}</Text>
          </View>
          <View style={styles.walletSelectorTypeContainer}>
            <View
              style={
                fromWalletCurrency === WalletCurrency.Btc
                  ? styles.walletSelectorTypeLabelBitcoin
                  : styles.walletSelectorTypeLabelUsd
              }
            >
              {fromWalletCurrency === WalletCurrency.Btc ? (
                <Text style={styles.walletSelectorTypeLabelBtcText}>BTC</Text>
              ) : (
                <Text style={styles.walletSelectorTypeLabelUsdText}>USD</Text>
              )}
            </View>
          </View>
          <View style={styles.walletSelectorInfoContainer}>
            <View style={styles.walletSelectorTypeTextContainer}>
              {fromWalletCurrency === WalletCurrency.Btc ? (
                <>
                  <Text style={styles.walletTypeText}>{`${LL.common.btcAccount()}`}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.walletTypeText}>{`${LL.common.usdAccount()}`}</Text>
                </>
              )}
            </View>
            <View style={styles.walletSelectorBalanceContainer}>
              {fromWalletCurrency === WalletCurrency.Btc ? (
                <>
                  <Text style={styles.walletBalanceText}>
                    {formatToDisplayCurrency(btcWalletValueInUsd)}
                    {" - "}
                    {satAmountDisplay(btcWalletBalance)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.walletBalanceText}>
                    {formatToDisplayCurrency(usdWalletBalance / 100)}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={styles.switchButtonContainer}>
          <TouchableWithoutFeedback style={styles.switchButton} onPress={switchWallets}>
            <SwitchButton />
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.toFieldContainer}>
          <View style={styles.fieldLabelContainer}>
            <Text style={styles.fieldLabel}>{LL.common.to()}</Text>
          </View>
          <View style={styles.walletSelectorTypeContainer}>
            <View
              style={
                toWalletCurrency === WalletCurrency.Btc
                  ? styles.walletSelectorTypeLabelBitcoin
                  : styles.walletSelectorTypeLabelUsd
              }
            >
              {toWalletCurrency === WalletCurrency.Btc ? (
                <Text style={styles.walletSelectorTypeLabelBtcText}>BTC</Text>
              ) : (
                <Text style={styles.walletSelectorTypeLabelUsdText}>USD</Text>
              )}
            </View>
          </View>
          <View style={styles.walletSelectorInfoContainer}>
            <View style={styles.walletSelectorTypeTextContainer}>
              {toWalletCurrency === WalletCurrency.Btc ? (
                <>
                  <Text style={styles.walletTypeText}>{`${LL.common.btcAccount()}`}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.walletTypeText}>{`${LL.common.usdAccount()}`}</Text>
                </>
              )}
            </View>
            <View style={styles.walletSelectorBalanceContainer}>
              {toWalletCurrency === WalletCurrency.Btc ? (
                <>
                  <Text style={styles.walletBalanceText}>
                    {formatToDisplayCurrency(btcWalletValueInUsd)}
                    {" - "}
                    {satAmountDisplay(btcWalletBalance)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.walletBalanceText}>
                    {formatToDisplayCurrency(usdWalletBalance / 100)}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
      <View style={styles.fieldContainer}>
        <View style={styles.amountFieldContainer}>
          <View style={styles.fieldLabelContainer}>
            <Text style={styles.amountFieldLabel}>{LL.SendBitcoinScreen.amount()}</Text>
          </View>
          <View style={styles.currencyInputContainer}>
            {fromWalletCurrency === WalletCurrency.Btc &&
              activeCurrencyInput === WalletCurrency.Btc && (
                <>
                  <FakeCurrencyInput
                    value={paymentAmountToDollarsOrSats(btcAmount)}
                    onChangeValue={setAmountsWithBtc}
                    prefix=""
                    delimiter=","
                    separator="."
                    precision={0}
                    suffix=" sats"
                    minValue={0}
                    style={styles.walletBalanceInput}
                  />
                  <FakeCurrencyInput
                    value={paymentAmountToDollarsOrSats(usdAmount)}
                    prefix="$"
                    delimiter=","
                    separator="."
                    precision={2}
                    editable={false}
                    minValue={0}
                    style={styles.convertedAmountText}
                  />
                </>
              )}
            {fromWalletCurrency === WalletCurrency.Btc &&
              activeCurrencyInput === WalletCurrency.Usd && (
                <>
                  <FakeCurrencyInput
                    value={paymentAmountToDollarsOrSats(usdAmount)}
                    onChangeValue={(value) => setAmountsWithUsd(Number(value) * 100)}
                    prefix="$"
                    delimiter=","
                    separator="."
                    precision={2}
                    style={styles.walletBalanceInput}
                    minValue={0}
                  />
                  <FakeCurrencyInput
                    value={paymentAmountToDollarsOrSats(btcAmount)}
                    prefix=""
                    delimiter=","
                    separator="."
                    suffix=" sats"
                    precision={0}
                    minValue={0}
                    editable={false}
                    style={styles.convertedAmountText}
                  />
                </>
              )}
            {fromWalletCurrency === WalletCurrency.Usd && (
              <FakeCurrencyInput
                value={paymentAmountToDollarsOrSats(usdAmount)}
                onChangeValue={(value) => setAmountsWithUsd(Number(value) * 100)}
                prefix="$"
                delimiter=","
                separator="."
                precision={2}
                style={styles.walletBalanceInput}
                minValue={0}
              />
            )}
          </View>
          {fromWalletCurrency === WalletCurrency.Btc && (
            <View style={styles.switchCurrencyIconContainer}>
              <TouchableWithoutFeedback onPress={toggleActiveCurrencyInput}>
                <View>
                  <SwitchButton />
                </View>
              </TouchableWithoutFeedback>
            </View>
          )}
        </View>
        {amountFieldError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{amountFieldError}</Text>
          </View>
        )}
      </View>
      <View style={styles.fieldContainer}>
        <View style={styles.percentageContainer}>
          <View style={styles.percentageLabelContainer}>
            <Text style={styles.percentageFieldLabel}>
              {LL.TransferScreen.percentageToConvert()}
            </Text>
          </View>
          <View style={styles.percentageFieldContainer}>
            <TouchableWithoutFeedback onPress={() => setAmountToBalancePercentage(25)}>
              <View style={styles.percentageField}>
                <Text>25%</Text>
              </View>
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={() => setAmountToBalancePercentage(50)}>
              <View style={styles.percentageField}>
                <Text>50%</Text>
              </View>
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={() => setAmountToBalancePercentage(75)}>
              <View style={styles.percentageField}>
                <Text>75%</Text>
              </View>
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={() => setAmountToBalancePercentage(100)}>
              <View style={styles.percentageField}>
                <Text>100%</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title={LL.common.next()}
          buttonStyle={[styles.button, styles.activeButtonStyle]}
          titleStyle={styles.activeButtonTitleStyle}
          disabledStyle={[styles.button, styles.disabledButtonStyle]}
          disabledTitleStyle={styles.disabledButtonTitleStyle}
          disabled={!isButtonEnabled()}
          onPress={moveToNextScreen}
        />
      </View>
    </ScrollView>
  )
}

const styles = EStyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  transferScreenContainer: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
  },
  fieldContainer: {
    padding: 10,
  },
  amountFieldContainer: {
    flexDirection: "row",
    backgroundColor: palette.white,
    borderRadius: 10,
  },
  toFieldContainer: {
    flexDirection: "row",
    backgroundColor: palette.white,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  switchButtonContainer: {
    height: 1,
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
    zIndex: 30,
  },
  switchButton: {
    height: 50,
    width: 50,
    borderRadius: 50,
    zIndex: 50,
    elevation: Platform.OS === "android" ? 50 : 0,
    backgroundColor: palette.lightGrey,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  fromFieldContainer: {
    flexDirection: "row",
    backgroundColor: palette.white,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
  },
  fieldLabelContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: palette.lapisLazuli,
    padding: 10,
    width: "50rem",
  },
  amountFieldLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: palette.lapisLazuli,
    padding: 10,
    width: "80rem",
  },
  percentageFieldLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: palette.lapisLazuli,
    padding: 10,
    width: "100rem",
  },
  walletSelectorTypeContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
    width: 50,
    margin: 20,
  },
  walletSelectorTypeLabelBitcoin: {
    height: 30,
    width: 50,
    borderRadius: 10,
    backgroundColor: palette.btcSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  walletSelectorTypeLabelUsd: {
    height: 30,
    width: 50,
    backgroundColor: palette.usdSecondary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  walletSelectorTypeLabelUsdText: {
    fontWeight: "bold",
    color: palette.usdPrimary,
  },
  walletSelectorTypeLabelBtcText: {
    fontWeight: "bold",
    color: palette.btcPrimary,
  },
  walletSelectorInfoContainer: {
    flex: 1,
    flexDirection: "column",
  },
  walletTypeText: {
    fontWeight: "bold",
    fontSize: 18,
    color: palette.lapisLazuli,
  },
  walletSelectorTypeTextContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  walletSelectorBalanceContainer: {
    flex: 1,
    flexDirection: "row",
  },
  walletBalanceText: {
    color: palette.midGrey,
  },
  walletBalanceInput: {
    color: palette.lapisLazuli,
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 20,
  },
  switchCurrencyIconContainer: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  convertedAmountText: {
    color: palette.coolGrey,
    fontSize: 12,
    marginLeft: 20,
  },
  currencyInputContainer: {
    flexDirection: "column",
    flex: 1,
    justifyContent: "center",
    height: "60rem",
  },
  percentageFieldContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flex: 4,
  },
  percentageField: {
    backgroundColor: palette.white,
    padding: 10,
    borderRadius: 10,
    fontWeight: "bold",
    flex: 1,
    margin: 4,
  },
  percentageLabelContainer: {
    flex: 1,
  },
  percentageContainer: {
    flexDirection: "row",
  },
  buttonContainer: {
    padding: 10,
    flex: 1,
    paddingTop: "80%",
  },
  button: {
    height: 50,
    borderRadius: 10,
  },
  disabledButtonStyle: {
    backgroundColor: palette.lighterGrey,
  },
  disabledButtonTitleStyle: {
    color: palette.lightBlue,
    fontWeight: "600",
  },
  activeButtonStyle: {
    backgroundColor: palette.lightBlue,
  },
  activeButtonTitleStyle: {
    color: palette.white,
    fontWeight: "bold",
  },
  errorContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  errorText: {
    color: color.error,
  },
})
