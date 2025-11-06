import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type ProjectRecord = {
  project_id: string
  account_id: string | null
  is_public: boolean | null
  sandbox: {
    sandbox_url?: string | null
    [key: string]: unknown
  } | null
}

export class PreviewAccessError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'PreviewAccessError'
    this.status = status
  }
}

export async function resolveProjectSandbox(projectId: string) {
  const adminClient = createAdminClient()

  const { data: projectData, error: projectError } = await adminClient
    .from('projects')
    .select('project_id, account_id, is_public, sandbox')
    .eq('project_id', projectId)
    .maybeSingle()

  if (projectError) {
    throw new PreviewAccessError('Erro ao consultar projeto', 500)
  }

  const project = projectData as ProjectRecord | null

  if (!project) {
    throw new PreviewAccessError('Projeto não encontrado ou acesso negado', 404)
  }

  const sandboxUrl = project.sandbox?.sandbox_url

  if (!sandboxUrl) {
    throw new PreviewAccessError('Sandbox indisponível para este projeto', 404)
  }

  if (project.is_public) {
    return {
      projectId: project.project_id,
      sandboxUrl,
      isPublic: true,
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new PreviewAccessError('Erro ao verificar sessão do usuário', 500)
  }

  if (!user) {
    throw new PreviewAccessError('Autenticação obrigatória para este projeto', 401)
  }

  if (!project.account_id) {
    throw new PreviewAccessError('Projeto sem conta associada', 500)
  }

  const { data: membershipData, error: membershipError } = await adminClient
    .schema('basejump')
    .from('account_user')
    .select('user_id')
    .eq('account_id', project.account_id)
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (membershipError) {
    throw new PreviewAccessError('Erro ao validar associação ao projeto', 500)
  }

  if (!membershipData) {
    throw new PreviewAccessError('Usuário não autorizado a acessar esta sandbox', 403)
  }

  return {
    projectId: project.project_id,
    sandboxUrl,
    isPublic: false,
  }
}

