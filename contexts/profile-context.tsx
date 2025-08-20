'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
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
    if (!session) {
      console.log('[ProfileContext] No session, skipping fetch.')
      return
    }

    console.log('[ProfileContext] Fetching profile...')
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_ai_settings')

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        const fetchedProfile = {
          ai_provider: data[0].provider,
          ai_settings: data[0].settings,
        }
        console.log('[ProfileContext] Profile fetched successfully:', fetchedProfile)
        setProfile(fetchedProfile)
      } else {
        console.log('[ProfileContext] No profile found in database.')
        setProfile(null)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchProfile()
  }, [session, fetchProfile])

  const updateProfile = async (newProfileData: Partial<Profile>) => {
    if (!session) throw new Error("No active session")

    const updatedProfile = {
      ai_provider: null,
      ai_settings: null,
      ...profile,
      ...newProfileData,
    }

    console.log('[ProfileContext] Optimistically updating profile state:', updatedProfile)
    setProfile(updatedProfile)

    try {
      console.log('[ProfileContext] Calling RPC to update profile in DB:', updatedProfile)
      const { error } = await supabase.rpc('update_ai_settings', {
        new_provider: updatedProfile.ai_provider,
        new_settings: updatedProfile.ai_settings,
      })

      if (error) {
        console.error('[ProfileContext] Error updating profile in DB, reverting state.', error)
        fetchProfile() // Revert optimistic update on error
        throw error
      }
      console.log('[ProfileContext] Profile updated successfully in DB.')
    } catch (error) {
        console.error("[ProfileContext] Unexpected error in updateProfile:", error)
        fetchProfile() // Revert optimistic update
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
