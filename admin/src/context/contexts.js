import { createContext, useContext } from 'react'

// Context objects and their hooks live apart from the provider components (Vite Fast Refresh)
export const DataContext = createContext(null)
export const AuthContext = createContext(null)

export const useData = () => useContext(DataContext)
export const useAuth = () => useContext(AuthContext)
