'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AIContextType {
  hasBillingError: boolean
  setHasBillingError: (hasError: boolean) => void
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: ReactNode }) {
  const [hasBillingError, setHasBillingError] = useState(false)

  return (
    <AIContext.Provider value={{ hasBillingError, setHasBillingError }}>
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}
