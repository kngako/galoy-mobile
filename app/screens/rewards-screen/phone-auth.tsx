import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Screen } from "../../components/screen"
import { Text } from "../../components/text"
import { inject } from "mobx-react"
import { useNavigation, useNavigationParam } from "react-navigation-hooks"
import { Onboarding } from "types"
import { StyleSheet, View, Image, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native"
import { TextInput, ScrollView } from "react-native-gesture-handler"
import PhoneInput from "react-native-phone-input"
import auth from "@react-native-firebase/auth"
import { isEmpty } from "ramda"

import { translate } from "../../i18n"
import { color } from "../../theme"
import { currentScreen } from "../../utils/navigation"

const phoneLogo = require("./PhoneLogo.png")
const phoneWithArrowLogo = require("./PhoneWithArrowLogo.png")

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },

  image: {
    alignSelf: "center",
    padding: 20,
    height: 90,
    resizeMode: "center",
  },

  text: {
    fontSize: 20,
    textAlign: "center",
    paddingHorizontal: 40,
    paddingBottom: 10,
  },

  phoneEntryContainer: {
    borderColor: color.palette.darkGrey,
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 10,
    marginHorizontal: 60,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },

  textEntry: {
    fontSize: 20,
    color: color.palette.darkGrey,
  },

  buttonContainer: {
    paddingHorizontal: 80,
    paddingVertical: 10,
  },

  buttonStyle: {
    backgroundColor: color.primary,
  },

  modalBackground: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "space-around",
    backgroundColor: "#00000040",
  },
  activityIndicatorWrapper: {
    backgroundColor: "#FFFFFF",
    height: 100,
    width: 100,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
})

export const WelcomePhoneInputScreen = inject("navigationStore")(({ navigationStore }) => {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")

  const { navigate } = useNavigation()

  const inputRef = useRef()

  console.tron.log(navigationStore)

  const send = async () => {
    console.tron.log(`initPhoneNumber ${inputRef.current.getValue()}`)

    if (!inputRef.current.isValidNumber()) {
      Alert.alert(`${inputRef.current.getValue()} ${translate("errors.invalidPhoneNumber")}`)
      return
    }

    try {
      setLoading(true)
      const confirmation = await auth().signInWithPhoneNumber(inputRef.current.getValue())
      if (!isEmpty(confirmation)) {
        setLoading(false)
        const screen = currentScreen(navigationStore.state) === "welcomePhoneInputBanking" ?
        "welcomePhoneValidationBanking" : "welcomePhoneValidation" // FIXME
        navigate(screen, { confirmation })
      } else {
        setErr(`confirmation object is empty? ${confirmation}`)
      }
    } catch (err) {
      console.tron.error(err)
      setErr(err.toString())
    }
  }

  // workaround of https://github.com/facebook/react-native/issues/10471
  useEffect(() => {
    if (err !== "") {
      setErr("")
      Alert.alert("error", err.toString(), [
        {
          text: "OK",
          onPress: () => {
            setLoading(false)
          },
        },
      ])
    }
  }, [err])

  return (
    <Screen>
      <KeyboardAvoidingView
        keyboardVerticalOffset={-110}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <View style={{ flex: 1 }} />
          <Image source={phoneLogo} style={styles.image} />
          <Text style={styles.text}>{translate("WelcomePhoneInputScreen.header")}</Text>
          <PhoneInput
            ref={inputRef}
            style={styles.phoneEntryContainer}
            textStyle={styles.textEntry}
            textProps={{
              autoFocus: true,
              placeholder: translate("WelcomePhoneInputScreen.placeholder"),
              returnKeyType: loading ? "default" : "done",
              onSubmitEditing: () => send(),
            }}
          />
          <View style={{ flex: 1 }} />
          <ActivityIndicator animating={loading} size="large" color={color.primary} />
          <View style={{ flex: 1 }} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
})

export const WelcomePhoneValidationScreen = inject("navigationStore")(inject("dataStore")(
  ({ navigationStore, dataStore }) => {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")

  const confirmation = useNavigationParam("confirmation")
  const { goBack, navigate } = useNavigation()

  const onAuthStateChanged = async user => {
    // TODO : User type
    console.tron.log(`onAuthStateChanged`, user)
    console.log(`onAuthStateChanged`, user)

    if (user.phoneNumber) {
      // FIXME duplicate with user.Phonenumber
      await dataStore.onboarding.add(Onboarding.phoneVerification)

      let result

      if (dataStore.lnd.syncedToChain) {
        result = await dataStore.lnd.openFirstChannel()
        console.tron.log("Success opening channel", result)
      } else {
        // just go back, we'll open the channel once sync is done
        result = true
      }

      if (result === true) {
        setLoading(false)
        
        if (currentScreen(navigationStore.state) === "welcomePhoneValidationBanking") {
          navigate("personalInformation")
        } else {
          goBack(null)
          goBack(null)
        }
        // FIXME


      } else {
        setErr(result.toString())
      }
    }
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged)
    return subscriber // unsubscribe on unmount
  }, [])

  const sendVerif = async () => {
    console.tron.log(`verifyPhoneNumber with code ${code}`)
    if (code.length !== 6) {
      Alert.alert(`code need to have 6 digits`)
      return
    }
    try {
      setLoading(true)
      await confirmation.confirm(code)
    } catch (err) {
      console.tron.error(err) // Invalid code
      setErr(err.toString())
    }
  }

  useEffect(() => {
    if (err !== "") {
      setErr("")
      Alert.alert("error", err.toString(), [
        {
          text: "OK",
          onPress: () => {
            setLoading(false)
          },
        },
      ])
    }
  }, [err])

  return (
    <Screen>
      <KeyboardAvoidingView
        keyboardVerticalOffset={-80}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView>
          <View style={{ flex: 1 }} />
          <Image source={phoneWithArrowLogo} style={styles.image} />
          <Text style={styles.text}>{translate("WelcomePhoneInputScreen.header")}</Text>
          <TextInput
            autoFocus={true}
            style={[styles.textEntry, styles.phoneEntryContainer]}
            onChangeText={input => setCode(input)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            placeholder={translate("WelcomePhoneValidationScreen.placeholder")}
            returnKeyType={loading ? "default" : "done"}
            maxLength={6}
            onSubmitEditing={() => sendVerif()}
          >
            {code}
          </TextInput>
          <View style={{ flex: 1 }} />
          <ActivityIndicator animating={loading} size="large" color={color.primary} />
          <View style={{ flex: 1 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}))