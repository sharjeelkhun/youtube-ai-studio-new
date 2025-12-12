'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSession } from './session-context'

interface Profile {
  ai_provider: string | null
  ai_settings: any | null
}

interface ProfileContextType {
  profile: Profile | null
  loading: boolean
  updateProfile: (newProfileData: Partial<Profile>) => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_ai_settings')

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        setProfile({
          ai_provider: data[0].provider,
          ai_settings: data[0].settings,
        })
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchProfile()

    // Listen for provider changes from other components
    const handleProviderChange = (event: CustomEvent) => {
      if (event.detail?.provider) {
        // Optimistically update or just refetch
        fetchProfile()
      }
    }

    // Listen for cross-tab changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'ai_provider_changed') {
        fetchProfile()
      }
    }

    window.addEventListener('ai-provider-changed' as any, handleProviderChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('ai-provider-changed' as any, handleProviderChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [session?.user?.id, fetchProfile])

  const updateProfile = async (newProfileData: Partial<Profile>) => {
    if (!session) throw new Error("No active session")

    const updatedProfile = {
      ai_provider: null,
      ai_settings: null,
      ...profile,
      ...newProfileData,
    }

    // Optimistically update the local state
    setProfile(updatedProfile)

    try {
      const { error } = await supabase.rpc('update_ai_settings', {
        new_provider: updatedProfile.ai_provider,
        new_settings: updatedProfile.ai_settings,
      })

      if (error) {
        // Revert optimistic update on error
        fetchProfile()
        throw error
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      // Revert optimistic update
      fetchProfile()
      throw error
    }
  }

  const value = {
    profile,
    loading,
    updateProfile,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
