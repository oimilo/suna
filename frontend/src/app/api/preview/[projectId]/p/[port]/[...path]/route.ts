import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Proxy variant that supports arbitrary ports: /api/preview/:projectId/p/:port/*
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; port: string; path: string[] }> }
) {
  const { projectId, port, path } = await params
  const filePath = path.join('/')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('sandbox')
    .eq('project_id', projectId)
    .eq('account_id', user.id)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 })
  }

  if (!project.sandbox?.sandbox_url) {
    return NextResponse.json({ error: 'No sandbox available for this project' }, { status: 404 })
  }

  // Original sandbox_url is typically like https://8080-<id>.proxy.daytona.works
  const sandboxUrl: string = project.sandbox.sandbox_url

  // Rewrite the leading port segment to the requested port
  const rewritten = sandboxUrl.replace(/https:\/\/(\d+)-/, `https://${port}-`)
  const cleanPath = filePath.replace(/^\/+/, '')
  const daytonaPreviewUrl = `${rewritten}/${cleanPath}`

  try {
    const response = await fetch(daytonaPreviewUrl, {
      method: 'GET',
      headers: {
        'X-Daytona-Skip-Preview-Warning': 'true',
        'Accept': '*/*',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `File not found: ${response.status}` }, { status: response.status })
    }

    const content = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'text/html'

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    })
  } catch (error) {
    console.error('Preview proxy (ported) error:', error)
    return NextResponse.json({ error: 'Failed to fetch file from sandbox' }, { status: 500 })
  }
}


