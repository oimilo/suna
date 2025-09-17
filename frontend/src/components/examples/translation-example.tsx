'use client';

import { usePtTranslations } from '@/hooks/use-pt-translations';
import { Button } from '@/components/ui/button';

/**
 * Exemplo de como usar o sistema de internacionalização
 * 
 * Para usar traduções em qualquer componente:
 * 1. Importe o hook: import { usePtTranslations } from '@/hooks/use-pt-translations';
 * 2. Use no componente: const { t } = usePtTranslations();
 * 3. Acesse as traduções: t('common.save'), t('landing.hero.title'), etc.
 */
export function TranslationExample() {
  const { t } = usePtTranslations();

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">{t('landing.hero.title')}</h1>
      <p className="text-muted-foreground">{t('landing.hero.subtitle')}</p>
      
      <div className="flex gap-2">
        <Button>{t('common.save')}</Button>
        <Button variant="outline">{t('common.cancel')}</Button>
        <Button variant="destructive">{t('common.delete')}</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">{t('workflows.title')}</h3>
          <Button size="sm">{t('workflows.create')}</Button>
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">{t('integrations.title')}</h3>
          <Button size="sm">{t('integrations.connect')}</Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Status: {t('workflows.status.running')}</p>
        <p>Ação: {t('actions.refresh')}</p>
      </div>
    </div>
  );
}

/**
 * GUIA DE USO DO SISTEMA DE INTERNACIONALIZAÇÃO
 * 
 * 1. ESTRUTURA DAS TRADUÇÕES
 *    As traduções estão organizadas em categorias no arquivo pt-BR.json:
 *    - common: textos comuns (save, cancel, delete, etc)
 *    - dashboard: textos do dashboard
 *    - auth: textos de autenticação
 *    - billing: textos de cobrança
 *    - agents: textos relacionados a agentes
 *    - workflows: textos de fluxos de trabalho
 *    - integrations: textos de integrações
 *    - landing: textos da página inicial
 *    - actions: ações comuns (copy, paste, refresh, etc)
 *    - errors: mensagens de erro
 *    - notifications: textos de notificações
 *    - files: textos relacionados a arquivos
 *    - thread: textos de conversas
 *    - settings: configurações
 *    - pricing: preços e planos
 *    - sidebar: navegação lateral
 * 
 * 2. COMO ADICIONAR NOVAS TRADUÇÕES
 *    a) Edite o arquivo /src/i18n/translations/pt-BR.json
 *    b) Adicione a nova chave na categoria apropriada
 *    c) Mantenha a mesma estrutura no arquivo en.json
 * 
 * 3. EXEMPLOS DE USO
 *    - Texto simples: t('common.save')
 *    - Texto aninhado: t('landing.hero.title')
 *    - Dentro de propriedades: placeholder={t('dashboard.inputPlaceholder')}
 *    - Em condicionais: isLoading ? t('common.loading') : t('common.save')
 * 
 * 4. PADRÕES DE NOMENCLATURA
 *    - Use camelCase para as chaves
 *    - Agrupe por contexto/página
 *    - Seja descritivo mas conciso
 *    - Mantenha consistência entre pt-BR e en
 * 
 * 5. DICAS
 *    - Sempre verifique se a chave existe antes de usar
 *    - Para textos longos, considere quebrar em múltiplas chaves
 *    - Use interpolação quando necessário (ainda não implementado)
 *    - Teste as traduções em diferentes tamanhos de tela
 */