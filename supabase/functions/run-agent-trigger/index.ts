// Supabase Edge Function: run-agent-trigger
// Handles async agent execution for triggers/automations

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  agent_run_id: string
  thread_id: string
  project_id: string
  agent_config: Record<string, any>
  model_name: string
  enable_thinking?: boolean
  reasoning_effort?: string
  trigger_variables?: Record<string, any>
}

// Constants from environment
const TRIGGER_SECRET = Deno.env.get('TRIGGER_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Internal API URL - using the webhook base URL from production
const INTERNAL_API_URL = 'https://app.prophet.build'

serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-trigger-secret, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validate authentication
    const incomingSecret = req.headers.get('x-trigger-secret')
    
    if (!incomingSecret || incomingSecret !== TRIGGER_SECRET) {
      console.error('Authentication failed: Invalid trigger secret')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 2. Parse request body
    const body: RequestBody = await req.json()
    console.log('Processing trigger execution:', {
      agent_run_id: body.agent_run_id,
      thread_id: body.thread_id,
      project_id: body.project_id
    })

    // 3. Validate required fields
    if (!body.agent_run_id || !body.thread_id || !body.project_id || !body.agent_config) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 4. Call internal API to execute agent
    const internalResponse = await fetch(`${INTERNAL_API_URL}/api/internal/execute-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': TRIGGER_SECRET, // Use same secret for internal auth
        'x-supabase-service-key': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        agent_run_id: body.agent_run_id,
        thread_id: body.thread_id,
        project_id: body.project_id,
        agent_config: body.agent_config,
        model_name: body.model_name || 'anthropic/claude-sonnet-4-20250514',
        enable_thinking: body.enable_thinking || false,
        reasoning_effort: body.reasoning_effort || 'low',
        trigger_variables: body.trigger_variables || {}
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    // 5. Handle internal API response
    if (!internalResponse.ok) {
      const errorText = await internalResponse.text()
      console.error('Internal API error:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to execute agent',
          details: errorText
        }),
        { 
          status: internalResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const result = await internalResponse.json()
    console.log('Agent execution started successfully:', result)

    // 6. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Agent execution initiated',
        agent_run_id: body.agent_run_id,
        ...result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ 
          error: 'Request timeout',
          message: 'The internal API took too long to respond'
        }),
        { 
          status: 504, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generic error response
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})