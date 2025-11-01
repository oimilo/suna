import { test } from 'node:test';
import assert from 'node:assert/strict';
import Module from 'module';
import React from 'react';
import { renderToString } from 'react-dom/server';

const originalLoad = Module._load;

Module._load = function patchedLoader(request: string, parent: NodeModule | null, isMain: boolean) {
  if (request === '@/hooks/react-query/files/use-image-content') {
    return {
      useImageContent: () => ({ data: 'https://example.com/mock.png', isLoading: false, error: null }),
    };
  }

  if (request === '@/hooks/useVapiCallRealtime') {
    return {
      useVapiCallRealtime: () => ({ status: 'completed', transcript: [] }),
    };
  }

  if (request === '@/lib/supabase/client') {
    return {
      createClient: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      }),
    };
  }

  if (request === '@tanstack/react-query') {
    return {
      useQuery: () => ({ data: null, isLoading: false, error: null }),
      QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      QueryClient: class {},
    };
  }

  if (request === 'framer-motion') {
    const createComponent = (tag: string) =>
      React.forwardRef<HTMLElement, any>((props, ref) => React.createElement(tag, { ref, ...props }, props.children));

    const motion = new Proxy(
      {},
      {
        get: (_target, key: string) => createComponent(key),
      },
    );

    return {
      motion,
      AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
  }

  return originalLoad(request, parent, isMain);
};

import { DesignerToolView } from '@/components/thread/tool-views/designer-tool/DesignerToolView';
import { MakeCallToolView } from '@/components/thread/tool-views/vapi-call/MakeCallToolView';
import { CallStatusToolView } from '@/components/thread/tool-views/vapi-call/CallStatusToolView';
import { ListCallsToolView } from '@/components/thread/tool-views/vapi-call/ListCallsToolView';
import { MonitorCallToolView } from '@/components/thread/tool-views/vapi-call/MonitorCallToolView';
import { EndCallToolView } from '@/components/thread/tool-views/vapi-call/EndCallToolView';
import { WaitForCallCompletionToolView } from '@/components/thread/tool-views/vapi-call/WaitForCallCompletionToolView';

const designerPayload = JSON.stringify({
  tool_execution: {
    arguments: {
      prompt: 'Crie uma landing page',
      mode: 'generate',
      sandbox_id: 'sandbox-1',
      width: 1280,
      height: 720,
    },
    result: {
      success: true,
      output: JSON.stringify({
        generated_image_path: 'workspace/designs/landing.png',
        status: 'completed',
      }),
    },
  },
});

const makeCallPayload = JSON.stringify({
  tool_execution: {
    arguments: {
      phone_number: '+15555550123',
      first_message: 'Olá!',
      model: 'claude',
    },
    result: {
      success: true,
      output: JSON.stringify({
        call_id: 'call-123',
        status: 'queued',
        phone_number: '+15555550123',
      }),
    },
  },
});

const callStatusPayload = JSON.stringify({
  tool_execution: {
    result: {
      success: true,
      output: JSON.stringify({
        call_id: 'call-123',
        status: 'completed',
        phone_number: '+15555550123',
        transcript: [
          { role: 'assistant', message: 'Olá, aqui é o agente.' },
          { role: 'user', message: 'Oi! Tudo bem?' },
        ],
      }),
    },
  },
});

const listCallsPayload = JSON.stringify({
  tool_execution: {
    result: {
      success: true,
      output: JSON.stringify({
        count: 1,
        calls: [
          {
            call_id: 'call-123',
            phone_number: '+15555550123',
            direction: 'outbound',
            status: 'completed',
            duration_seconds: 90,
          },
        ],
      }),
    },
  },
});

const monitorPayload = JSON.stringify({
  tool_execution: {
    arguments: {
      call_id: 'call-123',
    },
    result: {
      success: true,
      output: JSON.stringify({
        call_id: 'call-123',
        status: 'in-progress',
        transcript: [
          { role: 'assistant', message: 'Iniciando a chamada.' },
        ],
      }),
    },
  },
});

const endCallPayload = JSON.stringify({
  tool_execution: {
    result: {
      success: true,
      output: JSON.stringify({
        call_id: 'call-123',
        status: 'ended',
        message: 'Call terminated successfully',
      }),
    },
  },
});

const waitForCompletionPayload = JSON.stringify({
  tool_execution: {
    result: {
      success: true,
      output: JSON.stringify({
        call_id: 'call-123',
        final_status: 'completed',
        duration_seconds: 120,
        transcript_messages: 5,
        cost: 0.23,
      }),
    },
  },
});

test('DesignerToolView renderiza sem lançar exceções', () => {
  assert.doesNotThrow(() =>
    renderToString(
      <DesignerToolView
        name="designer-create-or-edit"
        assistantContent="Gerando design"
        toolContent={designerPayload}
        isSuccess
      />,
    ),
  );
});

test('MakeCallToolView renderiza com dados simulados', () => {
  assert.doesNotThrow(() =>
    renderToString(
      <MakeCallToolView
        name="make-phone-call"
        assistantContent="Iniciar ligação"
        toolContent={makeCallPayload}
        isSuccess
      />,
    ),
  );
});

test('CallStatusToolView renderiza com dados simulados', () => {
  assert.doesNotThrow(() =>
    renderToString(
      <CallStatusToolView
        name="get-call-details"
        assistantContent="Status da chamada"
        toolContent={callStatusPayload}
        isSuccess
      />,
    ),
  );
});

test('ListCallsToolView renderiza com dados simulados', () => {
  assert.doesNotThrow(() =>
    renderToString(
      <ListCallsToolView
        name="list-calls"
        assistantContent="Histórico de ligações"
        toolContent={listCallsPayload}
        isSuccess
      />,
    ),
  );
});

test('MonitorCallToolView renderiza com dados simulados', () => {
  assert.doesNotThrow(() =>
    renderToString(
      <MonitorCallToolView
        name="monitor-call"
        assistantContent="Acompanhando ligação"
        toolContent={monitorPayload}
        isSuccess
      />,
    ),
  );
});

test('EndCallToolView renderiza com dados simulados', () => {
  assert.doesNotThrow(() =>
    renderToString(
      <EndCallToolView
        name="end-call"
        assistantContent="Encerrar ligação"
        toolContent={endCallPayload}
        isSuccess
      />,
    ),
  );
});

test('WaitForCallCompletionToolView renderiza com dados simulados', () => {
  assert.doesNotThrow(() =>
    renderToString(
      <WaitForCallCompletionToolView
        name="wait-for-call-completion"
        assistantContent="Aguardando finalização"
        toolContent={waitForCompletionPayload}
        isSuccess
      />,
    ),
  );
});

Module._load = originalLoad;

