import React, { useRef, useEffect, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useAppStore } from '../../store/app';

interface MonacoEditorProps {
  value: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  height?: string | number;
  width?: string | number;
  theme?: 'vs-dark' | 'vs-light';
  options?: any;
  onMount?: (editor: any, monaco: Monaco) => void;
  className?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  language,
  onChange,
  readOnly = false,
  height = '100%',
  width = '100%',
  theme,
  options = {},
  onMount,
  className = '',
}) => {
  const { theme: appTheme } = useAppStore();
  const editorRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  const editorTheme = theme || (appTheme === 'dark' ? 'vs-dark' : 'vs-light');

  const defaultOptions = {
    readOnly,
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
    renderWhitespace: 'boundary',
    wordWrap: 'on',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    renderLineHighlight: 'line',
    selectionHighlight: true,
    matchBrackets: 'always',
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'mouseover',
    unfoldOnClickAfterEndOfLine: true,
    renderControlCharacters: false,
    renderIndentGuides: true,
    highlightActiveIndentGuide: true,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      bracketPairsHorizontal: true,
      highlightActiveBracketPair: true,
      indentation: true,
    },
    suggest: {
      enabled: true,
      showKeywords: true,
      showSnippets: true,
    },
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true,
    },
    parameterHints: { enabled: true },
    hover: { enabled: true },
    contextmenu: true,
    mouseWheelZoom: true,
    multiCursorModifier: 'ctrlCmd',
    accessibilitySupport: 'auto',
    ...options,
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    setIsReady(true);

    // Configure Monaco themes
    monaco.editor.defineTheme('reviewly-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
      ],
      colors: {
        'editor.background': '#0D1117',
        'editor.foreground': '#E6EDF3',
        'editor.lineHighlightBackground': '#21262D',
        'editor.selectionBackground': '#264F78',
        'editorLineNumber.foreground': '#6E7681',
        'editorLineNumber.activeForeground': '#E6EDF3',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editorIndentGuide.background': '#21262D',
        'editorIndentGuide.activeBackground': '#30363D',
        'editorBracketMatch.background': '#0E4429',
        'editorBracketMatch.border': '#238636',
      },
    });

    monaco.editor.defineTheme('reviewly-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0000FF' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
        { token: 'type', foreground: '267F99' },
        { token: 'function', foreground: '795E26' },
        { token: 'variable', foreground: '001080' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#24292F',
        'editor.lineHighlightBackground': '#F6F8FA',
        'editor.selectionBackground': '#0969DA40',
        'editorLineNumber.foreground': '#656D76',
        'editorLineNumber.activeForeground': '#24292F',
      },
    });

    // Apply custom theme
    if (appTheme === 'dark') {
      monaco.editor.setTheme('reviewly-dark');
    } else {
      monaco.editor.setTheme('reviewly-light');
    }

    // Configure language features
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Add custom key bindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Handle save action
      console.log('Save triggered');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      editor.getAction('actions.find').run();
    });

    if (onMount) {
      onMount(editor, monaco);
    }
  };

  useEffect(() => {
    if (editorRef.current && isReady) {
      const monaco = (window as any).monaco;
      if (monaco) {
        if (appTheme === 'dark') {
          monaco.editor.setTheme('reviewly-dark');
        } else {
          monaco.editor.setTheme('reviewly-light');
        }
      }
    }
  }, [appTheme, isReady]);

  return (
    <div className={`monaco-editor-container ${className}`} style={{ height, width }}>
      <Editor
        height={height}
        width={width}
        language={language}
        value={value}
        theme={editorTheme}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={defaultOptions}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-gray-400">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
};