import { useState, useMemo, useEffect, useRef } from 'react'
import Editor, { DiffEditor } from '@monaco-editor/react'
import { ArrowLeftRight, FileDiff, GitCompare, FileJson, FileText, Settings, GitCompareArrows } from 'lucide-react'
import './App.css'
import { HsafaProvider, ContentContainer, HsafaChat } from '@hsafa/ui-sdk'
import { createReplaceTools } from './tools/replaceTools'
function App() {
  const [code, setCode] = useState(`// Welcome to Monaco Editor
function hello() {
  console.log("Hello World!");
}

hello();
`)
  const [activeTab, setActiveTab] = useState('replace')
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>(code)
  const [originalContent, setOriginalContent] = useState<string>(code)
  const [showDiff, setShowDiff] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Ref to always get current file content - initialized and updated synchronously
  const fileContentRef = useRef(fileContent)
  fileContentRef.current = fileContent // Update synchronously on every render

  const navItems = [
    { id: 'replace', icon: ArrowLeftRight, label: 'Replace', agentId: 'cmh0b5c510004qguci50pzk0w' },
    { id: 'diff_patch', icon: FileDiff, label: 'Diff Patch', agentId: 'diff_patch' },
    { id: 'both', icon: GitCompare, label: 'Both', agentId: 'both' },
    { id: 'json', icon: FileJson, label: 'JSON', agentId: 'json' },
    { id: 'md', icon: FileText, label: 'Markdown', agentId: 'md' },
  ]
  const currentAgentId = navItems.find((n) => n.id === activeTab)?.agentId ?? ''

  // Track changes for diff viewer
  useEffect(() => {
    setHasChanges(fileContent !== originalContent)
  }, [fileContent, originalContent])

  // Tool implementations for Replace agent
  const replaceTools = useMemo(
    () => createReplaceTools(
      () => fileContentRef.current,  // Getter function that always returns current content
      setFileContent,
      setCode
    ),
    [setCode]
  )

  // Tool mapping based on active tab
  const currentTools = useMemo(() => {
    switch (activeTab) {
      case 'replace':
        return replaceTools
      case 'diff_patch':
        return {} // Placeholder for diff patch tools
      case 'both':
        return replaceTools // Can combine tools here
      default:
        return {}
    }
  }, [activeTab, replaceTools])

  return (
    <HsafaProvider baseUrl="http://localhost:3900">
      <ContentContainer>
    <div className="flex h-full ">
      {/* Vertical Navbar */}
      <nav className="flex flex-col bg-[#181818] w-12 items-center py-2 border-r-2 border-[#2a2a2a] relative">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => setActiveTab(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`p-2 my-1 rounded-md hover:text-white text-gray-300 transition-colors ${
                  activeTab === item.id ? 'bg-[#2a2a2a]' : ''
                }`}
              >
                <Icon size={20} className="" />
              </button>
              
              {/* VS Code-style Tooltip */}
              {hoveredItem === item.id && (
                <div className="absolute left-full top-3 ml-2 px-2 py-1 bg-[#181818] text-white text-xs rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                </div>
              )}
            </div>
          )
        })}
        
        <div className="flex-1" />
        
        <div className="relative group">
          <button
            onMouseEnter={() => setHoveredItem('settings')}
            onMouseLeave={() => setHoveredItem(null)}
            className="p-2 my-1 rounded-md hover:text-white text-gray-300 transition-colors "
          >
            <Settings size={24} className="text-gray-300" />
          </button>
          
         
        </div>
      </nav>

      {/* Main Editor Area */}
      <main className="flex-1 overflow-hidden flex flex-col w-full">
        {/* Editor Header with Controls */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#181818] border-b border-[#2a2a2a] w-full">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">editor.js</span>
            {hasChanges && (
              <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                Modified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <>
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className={`flex items-center gap-1 px-3 py-1 text-sm ${
                    showDiff 
                      ? 'text-blue-400 bg-blue-400/10' 
                      : 'text-gray-300 hover:text-white'
                  } hover:bg-[#2a2a2a] rounded transition-colors`}
                >
                  <GitCompareArrows size={16} />
                  {showDiff ? 'Hide Diff' : 'Show Diff'}
                </button>
                <button
                  onClick={() => {
                    setCode(originalContent)
                    setFileContent(originalContent)
                  }}
                  className="px-3 py-1 text-sm text-gray-300 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setOriginalContent(fileContent)}
                  className="px-3 py-1 text-sm text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded transition-colors"
                >
                  Accept Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1">
          {showDiff ? (
            <DiffEditor
              height="100%"
              language="javascript"
              original={originalContent}
              modified={code}
              theme="vs-dark"
              options={{
                fontSize: 14,
                renderSideBySide: false, // Inline diff mode
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: false,
                minimap: { enabled: true },
              }}
              onMount={(editor) => {
                // Allow editing in the modified editor
                const modifiedEditor = editor.getModifiedEditor()
                modifiedEditor.onDidChangeModelContent(() => {
                  const newValue = modifiedEditor.getValue()
                  setCode(newValue)
                  setFileContent(newValue)
                })
              }}
            />
          ) : (
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={code}
              theme="vs-dark"
              onChange={(value) => {
                const newValue = value || ''
                setCode(newValue)
                setFileContent(newValue)
              }}
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16 },
              }}
            />
          )}
        </div>
      </main>
    </div></ContentContainer>
    <HsafaChat 
    title={navItems.find((n) => n.id === activeTab)?.label ?? 'Editor'}
    agentId={currentAgentId}
    HsafaTools={currentTools}
    key={activeTab} />
    </HsafaProvider>
  )
}

export default App

