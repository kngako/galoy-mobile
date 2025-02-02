import { createContext, useContext } from "react"

export type AuthenticationContextType = {
  isAppLocked: boolean
  setAppUnlocked: () => void
  setAppLocked: () => void
}

// The initial value will never be null because the provider will always pass a non null value
// eslint-disable-next-line
// @ts-ignore
export const AuthenticationContext = createContext<AuthenticationContextType>(null)

export const useAuthenticationContext = () => useContext(AuthenticationContext)
