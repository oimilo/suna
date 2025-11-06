import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function responseContainsPreviewWarning(response: Response): Promise<boolean> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('text/html')) {
    return false
  }

  try {
    const body = await response.clone().text()
    return /preview url warning/i.test(body)
  } catch {
    return false
  }
}

async function fetchWithFallback(urls: string[]): Promise<{ response: Response; upstreamUrl: string }> {
  let lastProblem: { response: Response; url: string } | null = null
  let lastError: unknown = null

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Daytona-Skip-Preview-Warning': 'true',
          'Accept': '*/*',
        },
      })

      if (!response.ok) {
        lastProblem = { response, url }
        if (response.status === 404) {
          continue
        }
        return { response, upstreamUrl: url }
      }

      if (await responseContainsPreviewWarning(response)) {
        lastProblem = { response, url }
        continue
      }

      return { response, upstreamUrl: url }
    } catch (error) {
      console.error('Preview proxy fetch error for candidate:', url, error)
      lastError = error
    }
  }

  if (lastProblem) {
    return { response: lastProblem.response, upstreamUrl: lastProblem.url }
  }

  throw lastError ?? new Error('Failed to fetch preview asset')
}

// Root proxy for a specific port: /api/preview/:projectId/p/:port
// Forwards to the Daytona preview root ("/") on the requested port
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; port: string }> }
) {
  const { projectId, port } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('sandbox, is_public')
    .eq('project_id', projectId)
    .maybeSingle()

  if (projectError) {
    console.error('Preview proxy project lookup error:', projectError)
  }

  if (!project) {
    return NextResponse.json({ error: 'Project not found or access denied' }, { status: user ? 403 : 401 })
  }

  if (!project.sandbox?.sandbox_url) {
    return NextResponse.json({ error: 'No sandbox available for this project' }, { status: 404 })
  }

  // sandbox_url example: https://8080-<id>.proxy.daytona.works
  const sandboxUrl: string = project.sandbox.sandbox_url
  const rewritten = sandboxUrl.replace(/https:\/\/(\d+)-/, `https://${port}-`)
  const searchParams = request.nextUrl.search
  const base = rewritten.replace(/\/+$/, '')
  const search = searchParams || ''

  const urlCandidates: string[] = []
  urlCandidates.push(`${base}/index.html${search}`)
  urlCandidates.push(`${base}/${search}`)

  try {
    const { response, upstreamUrl } = await fetchWithFallback(urlCandidates)

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
        'X-Upstream-URL': upstreamUrl,
      },
    })
  } catch (error) {
    console.error('Preview proxy (root) error:', error)
    return NextResponse.json({ error: 'Failed to fetch file from sandbox' }, { status: 500 })
  }
}


