import { NextRequest, NextResponse } from 'next/server'
import { PreviewAccessError, resolveProjectSandbox } from '../../project-access'

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
      console.error('Preview proxy lookup candidate error:', url, error)
      lastError = error
    }
  }

  if (lastProblem) {
    return { response: lastProblem.response, upstreamUrl: lastProblem.url }
  }

  throw lastError ?? new Error('Failed to fetch preview asset')
}

// Simple proxy to avoid Daytona preview warning
// This just redirects to Daytona with the skip-warning header
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; path: string[] }> }
) {
  const { projectId, path } = await params
  const filePath = path.join('/')

  let sandboxUrl: string

  try {
    const project = await resolveProjectSandbox(projectId)
    sandboxUrl = project.sandboxUrl
  } catch (error) {
    if (error instanceof PreviewAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Preview project access error:', error)
    return NextResponse.json({ error: 'Erro ao validar acesso ao projeto' }, { status: 500 })
  }

  // Extract sandbox URL and construct the preview URL
  // sandbox_url format: https://8080-sandbox-id.proxy.daytona.works
  const cleanPath = filePath.replace(/^\/+/, '')
  const rawSearch = request.nextUrl.search
  const normalizedPath = cleanPath.replace(/\/+$/, '')
  const search = rawSearch || ''
  const base = sandboxUrl.replace(/\/+$/, '')
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
    ...sanitizedSegments.map((segment) => `${base}/${segment}${search}`),
    ...(hasRootCandidate ? [`${base}/${search}`] : []),
  ])).filter(Boolean)

  if (urlCandidates.length === 0) {
    urlCandidates.push(`${base}/${search}`)
  }
  
  try {
    // Fetch from Daytona with skip-warning header and fallback handling
    const { response, upstreamUrl } = await fetchWithFallback(urlCandidates)
    
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
        'X-Upstream-URL': upstreamUrl,
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