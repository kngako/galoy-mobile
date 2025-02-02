import * as React from "react"
import { usePersistentStateContext } from "@app/store/persistent-state"

type UseTokenReturn = {
  token: string | undefined
  hasToken: boolean
  saveToken: (token: string) => void
  clearToken: () => void
}

export const getAuthorizationHeader = (token: string): string => {
  return `Bearer ${token}`
}

const useToken = (): UseTokenReturn => {
  const { persistentState, updateState } = usePersistentStateContext()

  return React.useMemo(
    () => ({
      token: persistentState.galoyAuthToken,
      hasToken: Boolean(persistentState.galoyAuthToken),
      saveToken: (token: string) => {
        updateState((state) => {
          if (state)
            return {
              ...state,
              galoyAuthToken: token,
            }
          return undefined
        })
      },
      clearToken: () => {
        updateState((state) => {
          if (state)
            return {
              ...state,
              galoyAuthToken: "",
            }
          return undefined
        })
      },
    }),
    [persistentState.galoyAuthToken, updateState],
  )
}

export default useToken
