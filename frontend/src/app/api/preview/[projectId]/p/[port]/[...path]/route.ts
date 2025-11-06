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
      console.error('Preview proxy (ported path) candidate error:', url, error)
      lastError = error
    }
  }

  if (lastProblem) {
    return { response: lastProblem.response, upstreamUrl: lastProblem.url }
  }

  throw lastError ?? new Error('Failed to fetch preview asset')
}

// Proxy variant that supports arbitrary ports: /api/preview/:projectId/p/:port/*
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; port: string; path: string[] }> }
) {
  const { projectId, port, path } = await params
  const filePath = path.join('/')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('sandbox, is_public')
    .eq('project_id', projectId)
    .maybeSingle()

  if (projectError) {
    console.error('Preview proxy (ported) project lookup error:', projectError)
  }

  if (!project) {
    return NextResponse.json({ error: 'Project not found or access denied' }, { status: user ? 403 : 401 })
  }

  if (!project.sandbox?.sandbox_url) {
    return NextResponse.json({ error: 'No sandbox available for this project' }, { status: 404 })
  }

  // Original sandbox_url is typically like https://8080-<id>.proxy.daytona.works
  const sandboxUrl: string = project.sandbox.sandbox_url

  // Rewrite the leading port segment to the requested port
  const rewritten = sandboxUrl.replace(/https:\/\/(\d+)-/, `https://${port}-`)
  const cleanPath = filePath.replace(/^\/+/, '')
  const normalizedPath = cleanPath.replace(/\/+$/, '')
  const searchParams = request.nextUrl.search || ''
  const base = rewritten.replace(/\/+$/, '')
  const endsWithSlash = request.nextUrl.pathname.endsWith('/')

  const candidateSegments: (string | undefined)[] = []
  if (!normalizedPath || endsWithSlash) {
    const indexSegment = normalizedPath ? `${normalizedPath}/index.html` : 'index.html'
    candidateSegments.push(indexSegment)
  }
  candidateSegments.push(normalizedPath || undefined)

  const hasRootCandidate = candidateSegments.some((segment) => segment === undefined)
  const sanitizedSegments = candidateSegments
    .filter((segment): segment is string => typeof segment === 'string')
    .map((segment) => segment.replace(/^\/+/, ''))

  const urlCandidates = Array.from(new Set([
    ...sanitizedSegments.map((segment) => `${base}/${segment}${searchParams}`),
    ...(hasRootCandidate ? [`${base}/${searchParams}`] : []),
  ])).filter(Boolean)

  if (urlCandidates.length === 0) {
    urlCandidates.push(`${base}/${searchParams}`)
  }

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
        'X-Proxy-Project': projectId,
        'X-Proxy-Port': port,
      },
    })
  } catch (error) {
    console.error('Preview proxy (ported) error:', error)
    return NextResponse.json({ error: 'Failed to fetch file from sandbox' }, { status: 500 })
  }
}


