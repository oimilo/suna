import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple proxy to avoid Daytona preview warning
// This just redirects to Daytona with the skip-warning header
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; path: string[] }> }
) {
  const { projectId, path } = await params
  const filePath = path.join('/')
  
  // Get current user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Verify user has access to the project (or that it's public)
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('sandbox, is_public')
    .eq('project_id', projectId)
    .maybeSingle()
  
  if (projectError) {
    console.error('Preview proxy lookup error:', projectError)
  }

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found or access denied' },
      { status: user ? 403 : 401 }
    )
  }
  
  if (!project.sandbox?.sandbox_url) {
    return NextResponse.json(
      { error: 'No sandbox available for this project' },
      { status: 404 }
    )
  }
  
  // Extract sandbox URL and construct the preview URL
  // sandbox_url format: https://8080-sandbox-id.proxy.daytona.works
  const sandboxUrl = project.sandbox.sandbox_url
  const cleanPath = filePath.replace(/^\/+/, '')
  const searchParams = request.nextUrl.search
  const daytonaPreviewUrl = `${sandboxUrl}/${cleanPath}${searchParams ? searchParams : ''}`
  
  try {
    // Fetch from Daytona with the skip-warning header
    const response = await fetch(daytonaPreviewUrl, {
      method: 'GET',
      headers: {
        'X-Daytona-Skip-Preview-Warning': 'true',
        'Accept': '*/*',
      },
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `File not found: ${response.status}` },
        { status: response.status }
      )
    }
    
    // Get the content
    const content = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'text/html'
    
    // Return the file with proper headers
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Upstream-URL': daytonaPreviewUrl,
        'X-Proxy-Project': projectId,
      }
    })
  } catch (error) {
    console.error('Preview proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file from sandbox' },
      { status: 500 }
    )
  }
}