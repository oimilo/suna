import { sunaClient } from './api-client'

// Minimal upstream-like surface we need now
export const sunaApi = {
  getComposioProfiles: async () => {
    return sunaClient.get('/secure-mcp/composio-profiles')
  },
}

