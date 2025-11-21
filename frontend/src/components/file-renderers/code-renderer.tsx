'use client';

import React, { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { langs } from '@uiw/codemirror-extensions-langs';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { xcodeLight } from '@uiw/codemirror-theme-xcode';
import { useTheme } from 'next-themes';
import { EditorView } from '@codemirror/view';

interface CodeRendererProps {
  content: string;
  language?: string;
  className?: string;
}

type LanguageFactory = (typeof langs)[keyof typeof langs];

// Map of language aliases to CodeMirror language support
const languageMap: Record<string, LanguageFactory> = {
  js: langs.javascript,
  javascript: langs.javascript,
  jsx: langs.jsx,
  ts: langs.typescript,
  typescript: langs.typescript,
  tsx: langs.tsx,
  html: langs.html,
  css: langs.css,
  json: langs.json,
  json5: langs.json,
  md: langs.markdown,
  markdown: langs.markdown,
  py: langs.python,
  python: langs.python,
  rust: langs.rust,
  rs: langs.rust,
  go: langs.go,
  java: langs.java,
  c: langs.c,
  cpp: langs.cpp,
  csharp: langs.csharp,
  cs: langs.csharp,
  php: langs.php,
  ruby: langs.ruby,
  rb: langs.ruby,
  sh: langs.shell,
  bash: langs.shell,
  shell: langs.shell,
  sql: langs.sql,
  yaml: langs.yaml,
  yml: langs.yaml,
  vue: langs.vue,
  svelte: langs.svelte,
};

export function CodeRenderer({
  content,
  language = '',
  className,
}: CodeRendererProps) {
  // Get current theme
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Set mounted state to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine the language extension to use
  const langExtension =
    language && languageMap[language] ? [languageMap[language]()] : [];

  // Add line wrapping extension
  const extensions = [...langExtension, EditorView.lineWrapping];

  // Select the theme based on the current theme
  const theme = mounted && resolvedTheme === 'dark' ? vscodeDark : xcodeLight;

  return (
    <ScrollArea className={cn('w-full h-full', className)}>
      <div className="w-full">
        <CodeMirror
          value={content}
          theme={theme}
          extensions={extensions}
          basicSetup={{
            lineNumbers: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
            foldGutter: false,
          }}
          editable={false}
          className="text-sm w-full min-h-full"
          style={{ maxWidth: '100%' }}
          height="auto"
        />
      </div>
    </ScrollArea>
  );
}
