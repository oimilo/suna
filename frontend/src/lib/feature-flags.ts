import React from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import posthog from 'posthog-js'
import { agentPlaygroundEnabled, marketplaceEnabled } from '@/flags'

const DEFAULT_FLAGS: Record<string, boolean> = {
  custom_agents: agentPlaygroundEnabled,
  agent_marketplace: marketplaceEnabled,
}

const CACHE_DURATION = 5 * 60 * 1000
const flagCache = new Map<string, { value: boolean; timestamp: number }>()
let globalFlagsCache: { flags: Record<string, boolean>; timestamp: number } | null = null
let posthogInitialized = false

const isBrowser = typeof window !== 'undefined'

function ensurePosthogInitialized(): boolean {
  if (!isBrowser) {
    return false
  }

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) {
    return false
  }

  if (posthogInitialized) {
    return true
  }

  try {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      capture_pageview: false,
      capture_pageleave: false,
    })
    posthogInitialized = true
    return true
  } catch (error) {
    console.warn('[FeatureFlags] Failed to initialise PostHog:', error)
    return false
  }
}

function getFallbackValue(flagName: string): boolean {
  if (flagName in DEFAULT_FLAGS) {
    return DEFAULT_FLAGS[flagName]
  }
  return false
}

async function fetchFlag(flagName: string): Promise<boolean> {
  const fallback = getFallbackValue(flagName)

  if (!ensurePosthogInitialized()) {
    return fallback
  }

  const readFlag = () => {
    const result = posthog.isFeatureEnabled(flagName, { send_event: false })
    if (typeof result === 'boolean') {
      return result
    }
    return undefined
  }

  const immediate = readFlag()
  if (typeof immediate === 'boolean') {
    return immediate
  }

  await new Promise<void>((resolve) => {
    let resolved = false

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        resolve()
      }
    }, 500)

    posthog.reloadFeatureFlags()
    posthog.onFeatureFlags(() => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        resolve()
      }
    })
  })

  const afterReload = readFlag()
  if (typeof afterReload === 'boolean') {
    return afterReload
  }

  return fallback
}

export class FeatureFlagManager {
  private static instance: FeatureFlagManager

  private constructor() {}

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager()
    }
    return FeatureFlagManager.instance
  }

  async isEnabled(flagName: string): Promise<boolean> {
    const cached = flagCache.get(flagName)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.value
    }

    const value = await fetchFlag(flagName)
    flagCache.set(flagName, { value, timestamp: Date.now() })
    return value
  }

  async getFlagDetails(flagName: string): Promise<{ flag_name: string; enabled: boolean }> {
    const enabled = await this.isEnabled(flagName)
    return { flag_name: flagName, enabled }
  }

  async getAllFlags(): Promise<Record<string, boolean>> {
    if (globalFlagsCache && Date.now() - globalFlagsCache.timestamp < CACHE_DURATION) {
      return globalFlagsCache.flags
    }

    const entries = await Promise.all(
      Object.keys(DEFAULT_FLAGS).map(async (flagName) => {
        const enabled = await this.isEnabled(flagName)
        return [flagName, enabled] as const
      })
    )

    const flags = Object.fromEntries(entries)
    globalFlagsCache = { flags, timestamp: Date.now() }
    return flags
  }

  clearCache(): void {
    flagCache.clear()
    globalFlagsCache = null
  }

  async preloadFlags(flagNames: string[]): Promise<void> {
    await Promise.all(flagNames.map((flag) => this.isEnabled(flag)))
  }
}

const featureFlagManager = FeatureFlagManager.getInstance()

export const isEnabled = (flagName: string): Promise<boolean> => {
  return featureFlagManager.isEnabled(flagName)
}

export const getFlagDetails = (flagName: string): Promise<{ flag_name: string; enabled: boolean }> => {
  return featureFlagManager.getFlagDetails(flagName)
}

export const getAllFlags = (): Promise<Record<string, boolean>> => {
  return featureFlagManager.getAllFlags()
}

export const clearFlagCache = (): void => {
  featureFlagManager.clearCache()
}

export const preloadFlags = (flagNames: string[]): Promise<void> => {
  return featureFlagManager.preloadFlags(flagNames)
}

export const featureFlagKeys = {
  all: ['feature-flags'] as const,
  flag: (flagName: string) => [...featureFlagKeys.all, 'flag', flagName] as const,
  allFlags: () => [...featureFlagKeys.all, 'all'] as const,
}

export const useFeatureFlag = (flagName: string, options?: {
  enabled?: boolean
}) => {
  const query = useQuery({
    queryKey: featureFlagKeys.flag(flagName),
    queryFn: () => featureFlagManager.isEnabled(flagName),
    staleTime: CACHE_DURATION,
    enabled: options?.enabled !== false,
  })

  return React.useMemo(() => ({
    enabled: query.data ?? getFallbackValue(flagName),
    loading: query.isLoading,
    error: (query.error as Error) ?? null,
    refresh: query.refetch,
  }), [flagName, query])
}

export const useFeatureFlags = (flagNames: string[], options?: {
  enabled?: boolean
}) => {
  const queries = useQueries({
    queries: flagNames.map((flagName) => ({
      queryKey: featureFlagKeys.flag(flagName),
      queryFn: () => featureFlagManager.isEnabled(flagName),
      staleTime: CACHE_DURATION,
      enabled: options?.enabled !== false,
    })),
  })

  return React.useMemo(() => ({
    flags: flagNames.reduce<Record<string, boolean>>((acc, flagName, index) => {
      const query = queries[index]
      acc[flagName] = query.data ?? getFallbackValue(flagName)
      return acc
    }, {}),
    loading: queries.some((query) => query.isLoading),
    errors: queries.map((query) => (query.error as Error) ?? null),
    refresh: () => queries.forEach((query) => query.refetch()),
  }), [flagNames, queries])
}

export const useAllFeatureFlags = (options?: { enabled?: boolean }) => {
  const query = useQuery({
    queryKey: featureFlagKeys.allFlags(),
    queryFn: () => featureFlagManager.getAllFlags(),
    staleTime: CACHE_DURATION,
    enabled: options?.enabled !== false,
  })

  return React.useMemo(() => ({
    flags: query.data ?? { ...DEFAULT_FLAGS },
    loading: query.isLoading,
    error: (query.error as Error) ?? null,
    refresh: query.refetch,
  }), [query])
}

export const isFlagEnabled = isEnabled
