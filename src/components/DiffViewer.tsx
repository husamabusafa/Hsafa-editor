import { DiffEditor } from '@monaco-editor/react'

interface DiffViewerProps {
  original: string
  modified: string
  language?: string
  onClose: () => void
}

export default function DiffViewer({ original, modified, language = 'javascript', onClose }: DiffViewerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-[90vw] h-[90vh] bg-[#1e1e1e] rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#181818] border-b border-[#2a2a2a]">
          <h3 className="text-white font-semibold">Code Changes</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors px-3 py-1 rounded hover:bg-[#2a2a2a]"
          >
            ✕ Close
          </button>
        </div>

        {/* Diff Editor */}
        <div className="flex-1">
          <DiffEditor
            original={original}
            modified={modified}
            language={language}
            theme="vs-dark"
            options={{
              readOnly: true,
              renderSideBySide: true,
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              minimap: { enabled: true },
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#181818] border-t border-[#2a2a2a] text-sm text-gray-400">
          <span className="text-green-400">●</span> Added lines | <span className="text-red-400">●</span> Removed lines
        </div>
      </div>
    </div>
  )
}
