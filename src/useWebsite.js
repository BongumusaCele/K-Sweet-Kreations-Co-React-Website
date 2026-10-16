import { createContext, useContext } from 'react'
export const WebsiteContext = createContext(null)
export function useWebsite() {
  const context = useContext(WebsiteContext)
  if (!context) throw new Error('Website context is missing.')
  return context
}
