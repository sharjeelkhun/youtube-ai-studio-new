'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AIContextType {
  billingErrorProvider: string | null
  setBillingErrorProvider: (providerId: string | null) => void
}

const AIContext = createContext<AIContextType | undefined>(undefined)

export function AIProvider({ children }: { children: ReactNode }) {
  const [billingErrorProvider, setBillingErrorProvider] = useState<string | null>(null)

  return (
    <AIContext.Provider value={{ billingErrorProvider, setBillingErrorProvider }}>
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
