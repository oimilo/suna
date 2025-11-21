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
const availableLangs = langs as unknown as Record<string, LanguageFactory>;

// Map of language aliases to CodeMirror language support
const languageMap: Record<string, LanguageFactory> = {
  js: availableLangs.javascript,
  javascript: availableLangs.javascript,
  jsx: availableLangs.jsx,
  ts: availableLangs.typescript,
  typescript: availableLangs.typescript,
  tsx: availableLangs.tsx,
  html: availableLangs.html,
  css: availableLangs.css,
  json: availableLangs.json,
  json5: availableLangs.json,
  md: availableLangs.markdown,
  markdown: availableLangs.markdown,
  py: availableLangs.python,
  python: availableLangs.python,
  rust: availableLangs.rust,
  rs: availableLangs.rust,
  go: availableLangs.go,
  java: availableLangs.java,
  c: availableLangs.c,
  cpp: availableLangs.cpp,
  csharp: availableLangs.csharp,
  cs: availableLangs.csharp,
  php: availableLangs.php,
  ruby: availableLangs.ruby,
  rb: availableLangs.ruby,
  sh: availableLangs.shell,
  bash: availableLangs.shell,
  shell: availableLangs.shell,
  sql: availableLangs.sql,
  yaml: availableLangs.yaml,
  yml: availableLangs.yaml,
  vue: availableLangs.vue,
  svelte: availableLangs.svelte,
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
