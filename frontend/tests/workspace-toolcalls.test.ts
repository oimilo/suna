import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ToolCallInput,
  computeMainFileScore,
  detectMainFileIndex,
  shouldAutoOpenForStreaming,
  MAIN_FILE_SCORE_THRESHOLD,
} from '@/components/thread/tool-call-helpers';
import { shouldFilterAskTool } from '@/app/(dashboard)/projects/[projectId]/thread/_hooks/useToolCalls';

const createToolCall = (name: string, content: string, resultContent?: string): ToolCallInput => ({
  assistantCall: {
    name,
    content,
    timestamp: new Date().toISOString(),
  },
  toolResult: resultContent
    ? {
        content: resultContent,
        isSuccess: true,
        timestamp: new Date().toISOString(),
      }
    : undefined,
});

test('detectMainFileIndex identifies landing page as principal entrega', () => {
  const landingCall = createToolCall(
    'create-file',
    '<create-file file_path="landing_page.html"></create-file>',
  );

  const result = detectMainFileIndex([landingCall]);
  assert.equal(result, 0);
});

test('detectMainFileIndex ignora arquivos auxiliares como style.css', () => {
  const landingCall = createToolCall(
    'create-file',
    '<create-file file_path="landing_page.html"></create-file>',
  );
  const styleCall = createToolCall(
    'create-file',
    '<create-file file_path="style.css"></create-file>',
  );

  const result = detectMainFileIndex([styleCall, landingCall]);
  assert.equal(result, 1);
});

test('shouldAutoOpenForStreaming aprova landing_page apenas após heurística', () => {
  const decision = shouldAutoOpenForStreaming(
    'create-file',
    '<create-file file_path="landing_page.html"></create-file>',
    { index: 0, totalCalls: 1 },
  );

  assert.equal(decision.shouldOpen, true);
  assert.equal(decision.fileName, 'landing_page.html');
  assert.ok((decision.score ?? 0) >= MAIN_FILE_SCORE_THRESHOLD);
});

test('shouldAutoOpenForStreaming recusa arquivos auxiliares', () => {
  const decision = shouldAutoOpenForStreaming(
    'create-file',
    '<create-file file_path="style.css"></create-file>',
    { index: 0, totalCalls: 1 },
  );

  assert.equal(decision.shouldOpen, false);
});

test('computeMainFileScore excede o threshold para landing_page', () => {
  const score = computeMainFileScore({
    index: 0,
    totalCalls: 1,
    fileName: 'landing_page.html',
    filePath: 'landing_page.html',
    toolName: 'create-file',
  });

  assert.ok(score >= MAIN_FILE_SCORE_THRESHOLD);
});

test('shouldFilterAskTool descarta asks sem anexos', () => {
  const payload = JSON.stringify({
    tool_execution: {
      arguments: {
        text: 'Preciso de ajuda',
        attachments: [],
      },
      result: {
        success: true,
        output: JSON.stringify({ status: 'pending' }),
      },
    },
  });

  assert.equal(shouldFilterAskTool('ask', payload, payload), true);
});

test('shouldFilterAskTool mantém asks com anexos', () => {
  const payload = JSON.stringify({
    tool_execution: {
      arguments: {
        text: 'Analise o documento',
        attachments: ['reports/finance.pdf'],
      },
      result: {
        success: true,
        output: JSON.stringify({ status: 'queued' }),
      },
    },
  });

  assert.equal(shouldFilterAskTool('ask', payload, payload), false);
});

