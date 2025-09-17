import { useQuery } from '@tanstack/react-query';
import { TriggerProvider } from '@/components/agents/triggers/types';
import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3008';

// Providers temporários caso a API falhe
const FALLBACK_PROVIDERS: TriggerProvider[] = [
  {
    provider_id: 'schedule',
    name: 'Agendamento',
    description: 'Execute o agente em horários específicos',
    trigger_type: 'schedule',
    webhook_enabled: false,
    config_schema: {
      schedule: {
        type: 'cron',
        label: 'Horário',
        description: 'Configure quando o agente deve ser executado',
        required: true
      }
    }
  },
  {
    provider_id: 'webhook',
    name: 'Webhook',
    description: 'Execute o agente quando receber uma requisição HTTP',
    trigger_type: 'webhook',
    webhook_enabled: true,
    config_schema: {
      secret: {
        type: 'string',
        label: 'Secret',
        description: 'Token secreto para validar requisições',
        required: false
      }
    }
  },
  {
    provider_id: 'telegram',
    name: 'Telegram',
    description: 'Execute o agente através de comandos do Telegram',
    trigger_type: 'telegram',
    webhook_enabled: false,
    config_schema: {
      bot_token: {
        type: 'string',
        label: 'Bot Token',
        description: 'Token do bot do Telegram',
        required: true
      },
      chat_id: {
        type: 'string',
        label: 'Chat ID',
        description: 'ID do chat onde o bot deve responder',
        required: false
      }
    }
  },
  {
    provider_id: 'discord',
    name: 'Discord',
    description: 'Execute o agente através de comandos do Discord',
    trigger_type: 'discord',
    webhook_enabled: false,
    config_schema: {
      webhook_url: {
        type: 'string',
        label: 'Webhook URL',
        description: 'URL do webhook do Discord',
        required: true
      }
    }
  },
  {
    provider_id: 'slack',
    name: 'Slack',
    description: 'Execute o agente através de comandos do Slack',
    trigger_type: 'slack',
    webhook_enabled: false,
    config_schema: {
      webhook_url: {
        type: 'string',
        label: 'Webhook URL',
        description: 'URL do webhook do Slack',
        required: true
      }
    }
  },
  {
    provider_id: 'email',
    name: 'Email',
    description: 'Execute o agente quando receber emails específicos',
    trigger_type: 'email',
    webhook_enabled: false,
    config_schema: {
      email_address: {
        type: 'string',
        label: 'Endereço de Email',
        description: 'Email que irá disparar o agente',
        required: true
      },
      subject_filter: {
        type: 'string',
        label: 'Filtro de Assunto',
        description: 'Filtrar emails por assunto (opcional)',
        required: false
      }
    }
  }
];

const fetchTriggerProviders = async (): Promise<TriggerProvider[]> => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('You must be logged in to view trigger providers');
  }
  
  try {
    const response = await fetch(`${API_URL}/triggers/providers`, {
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${session.access_token}` 
      },
    });
    
    if (!response.ok) {
      // Se a API falhar, usar providers de fallback
      console.warn('Failed to fetch providers from API, using fallback');
      return FALLBACK_PROVIDERS;
    }
    
    return response.json();
  } catch (error) {
    // Em caso de erro de rede, usar fallback
    console.warn('Network error fetching providers, using fallback:', error);
    return FALLBACK_PROVIDERS;
  }
};

export const useTriggerProviders = () => {
  return useQuery({
    queryKey: ['trigger-providers'],
    queryFn: fetchTriggerProviders,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}; 