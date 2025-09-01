import { createAdminClient } from "@/lib/supabase/admin"

export default async function DebugPage() {
  const supabase = createAdminClient()
  
  // Buscar todos os usuários
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  
  // Buscar todas as contas
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
  
  // Buscar todas as assinaturas
  const { data: subscriptions } = await supabase
    .from('billing_subscriptions')
    .select('*')
  
  // Buscar account_user
  const { data: accountUsers } = await supabase
    .from('account_user')
    .select('*')
  
  // Emails específicos para verificar
  const targetEmails = [
    'claudio.ferreira@trademaster.com.br',
    'cavallari@neurociente.com.br',
    'vinicius@agenciadebolso.com'
  ]
  
  // Buscar contas que pertencem a esses usuários mas de formas alternativas
  const targetUserIds = targetEmails.map(email => {
    const user = authUsers?.users?.find(u => u.email === email)
    return user?.id
  }).filter(Boolean)
  
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Debug - Análise de Usuários e Assinaturas</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Estatísticas Gerais</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-500">Total Usuários (auth.users)</div>
            <div className="text-2xl font-bold">{authUsers?.users?.length || 0}</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-500">Total Contas</div>
            <div className="text-2xl font-bold">{accounts?.length || 0}</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-500">Total Assinaturas</div>
            <div className="text-2xl font-bold">{subscriptions?.length || 0}</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-sm text-gray-500">Assinaturas Ativas</div>
            <div className="text-2xl font-bold">
              {subscriptions?.filter(s => s.status === 'active').length || 0}
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Análise de Usuários Específicos</h2>
        {targetEmails.map(email => {
          const user = authUsers?.users?.find(u => u.email === email)
          
          if (!user) {
            return (
              <div key={email} className="p-4 border rounded bg-red-50">
                <div className="font-bold text-red-600">❌ {email}</div>
                <div className="text-sm text-red-500">Usuário não encontrado no auth.users</div>
              </div>
            )
          }
          
          // Encontrar contas do usuário
          const personalAccount = accounts?.find(a => a.id === user.id && a.personal_account === true)
          const ownedAccounts = accounts?.filter(a => a.primary_owner_user_id === user.id) || []
          const accountRelations = accountUsers?.filter(au => au.user_id === user.id) || []
          
          // Coletar todos os IDs de conta
          const allAccountIds = [
            ...(personalAccount ? [personalAccount.id] : []),
            ...ownedAccounts.map(a => a.id),
            ...accountRelations.map(r => r.account_id)
          ]
          const uniqueAccountIds = [...new Set(allAccountIds)]
          
          // Verificar assinaturas
          const userSubscriptions = subscriptions?.filter(s => 
            uniqueAccountIds.includes(s.account_id)
          ) || []
          
          return (
            <div key={email} className="p-4 border rounded bg-green-50">
              <div className="font-bold text-green-600">✅ {email}</div>
              <div className="text-sm space-y-1 mt-2">
                <div>User ID: {user.id}</div>
                <div>Conta Pessoal: {personalAccount ? `Sim (${personalAccount.id})` : 'Não'}</div>
                <div>Contas como Owner: {ownedAccounts.length}</div>
                <div>Relações account_user: {accountRelations.length}</div>
                <div>Total de Contas: {uniqueAccountIds.length}</div>
                <div className="font-semibold">
                  Assinaturas: {userSubscriptions.length > 0 ? (
                    userSubscriptions.map(s => (
                      <div key={s.id} className="ml-4">
                        - Conta {s.account_id.slice(0, 8)}: {s.status}
                      </div>
                    ))
                  ) : (
                    <span className="text-red-500">Nenhuma assinatura encontrada</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Busca de Contas por Nome/Email</h2>
        <div className="text-sm text-gray-600">
          Procurando contas que possam pertencer aos usuários:
        </div>
        {targetEmails.map(email => {
          // Buscar contas que contenham parte do email no nome
          const emailParts = email.split('@')[0].split('.')
          const matchingAccounts = accounts?.filter(account => {
            const accountNameLower = account.name?.toLowerCase() || ''
            return emailParts.some(part => 
              accountNameLower.includes(part.toLowerCase())
            ) || accountNameLower.includes(email.toLowerCase())
          }) || []
          
          return (
            <div key={email} className="p-4 border rounded">
              <div className="font-bold">Buscando contas para: {email}</div>
              {matchingAccounts.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {matchingAccounts.map(account => {
                    const hasSub = subscriptions?.find(s => 
                      s.account_id === account.id && s.status === 'active'
                    )
                    return (
                      <div key={account.id} className="ml-4 text-sm p-2 bg-gray-50 rounded">
                        <div><strong>Conta encontrada:</strong> {account.name}</div>
                        <div><strong>ID:</strong> {account.id}</div>
                        <div><strong>Pessoal:</strong> {account.personal_account ? 'Sim' : 'Não'}</div>
                        <div><strong>Primary Owner:</strong> {account.primary_owner_user_id || 'Não definido'}</div>
                        <div><strong>Tem assinatura ativa:</strong> {hasSub ? '✅ SIM' : '❌ Não'}</div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 mt-2">Nenhuma conta encontrada com esse nome/email</div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">TODAS as Assinaturas Ativas</h2>
        <div className="text-sm text-gray-600">
          Mostrando todas as assinaturas ativas e seus proprietários:
        </div>
        {subscriptions?.filter(s => s.status === 'active').map(sub => {
          const account = accounts?.find(a => a.id === sub.account_id)
          
          // Tentar encontrar o dono por várias estratégias
          let owner = null
          let ownerFoundBy = 'Não encontrado'
          
          // 1. Via primary_owner_user_id
          if (account?.primary_owner_user_id) {
            owner = authUsers?.users?.find(u => u.id === account.primary_owner_user_id)
            if (owner) ownerFoundBy = 'primary_owner_user_id'
          }
          
          // 2. Via account_user
          if (!owner) {
            const accountUserRelation = accountUsers?.find(au => au.account_id === sub.account_id)
            if (accountUserRelation) {
              owner = authUsers?.users?.find(u => u.id === accountUserRelation.user_id)
              if (owner) ownerFoundBy = 'account_user'
            }
          }
          
          // 3. Se conta pessoal (account.id === user.id)
          if (!owner && account?.personal_account) {
            owner = authUsers?.users?.find(u => u.id === account.id)
            if (owner) ownerFoundBy = 'conta pessoal'
          }
          
          const bgColor = owner ? 'bg-green-50' : 'bg-red-50'
          const icon = owner ? '✅' : '❌'
          
          return (
            <div key={sub.id} className={`p-4 border rounded ${bgColor}`}>
              <div className="font-bold">
                {icon} Assinatura {sub.id.slice(0, 8)}
              </div>
              <div className="text-sm space-y-1 mt-2">
                <div><strong>Account ID:</strong> {sub.account_id}</div>
                <div><strong>Account Name:</strong> {account?.name || 'Sem nome'}</div>
                <div><strong>Personal Account:</strong> {account?.personal_account ? 'Sim' : 'Não'}</div>
                <div><strong>Primary Owner ID:</strong> {account?.primary_owner_user_id || 'Não definido'}</div>
                <div><strong>Dono encontrado:</strong> {owner ? `${owner.email} (via ${ownerFoundBy})` : 'NÃO ENCONTRADO'}</div>
                <div><strong>Status:</strong> {sub.status}</div>
                <div><strong>Created:</strong> {new Date(sub.created).toLocaleString('pt-BR')}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}