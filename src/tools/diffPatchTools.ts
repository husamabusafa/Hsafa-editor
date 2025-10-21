import type { Dispatch, SetStateAction } from 'react'
import type { ToolResponse } from './replaceTools'
import { applyPatch } from 'diff'

interface ReplaceFileContentParams {
  Input: string
  Instruction: string
}

export const createDiffPatchTools = (
  getFileContent: () => string,
  setFileContent: Dispatch<SetStateAction<string>>,
  setCode: Dispatch<SetStateAction<string>>
) => ({
  replace_file_content: async (params: ReplaceFileContentParams): Promise<ToolResponse> => {
    try {
      const { Input, Instruction } = params
      const extractedPatch = extractUnifiedPatchOrDirect(Input)
      const normalizedPatch = normalizePatch(extractedPatch)

      const originalContent = getFileContent()
      const result = applyPatch(originalContent, normalizedPatch)

      if (result === false) {
        return {
          success: false,
          error: 'Patch failed to apply. Ensure the context lines match the current file content exactly.',
          explanation: Instruction
        }
      }

      if (result === originalContent) {
        return {
          success: false,
          error: 'Patch made no changes. Ensure the context matches the current file content.',
          explanation: Instruction
        }
      }

      setFileContent(result)
      setCode(result)

      return {
        success: true,
        message: 'Applied diff patch via applyPatch',
        explanation: Instruction,
        changes: 'Unified patch applied'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        explanation: params.Instruction
      }
    }
  },

  read_file: async (): Promise<ToolResponse> => {
    const fileContent = getFileContent()
    return {
      success: true,
      content: fileContent,
      lines: fileContent.split('\n').length
    }
  },
  read: async (): Promise<ToolResponse> => {
    const fileContent = getFileContent()
    return {
      success: true,
      content: fileContent,
      lines: fileContent.split('\n').length
    }
  }
})

// ---------- Internal helpers ----------

function extractUnifiedPatchOrDirect(input: string): string {
  const begin = '*** Begin Patch'
  const end = '*** End Patch'
  if (input.includes(begin) && input.includes(end)) {
    const body = input.slice(input.indexOf(begin) + begin.length, input.indexOf(end)).trim()
    const lines = body.split(/\r?\n/)
    const headerIdx = lines.findIndex((l) => l.startsWith('*** Update File:'))
    if (headerIdx === -1) throw new Error('Patch must include *** Update File: header')
    const diffLines = lines.slice(headerIdx + 1)
    return diffLines.join('\n')
  }
  return input.trim()
}

function normalizePatch(patch: string): string {
  const lines = patch.split(/\r?\n/)
  const normalized: string[] = []
  let i = 0

  // Add minimal file headers if missing
  if (!patch.includes('---') || !patch.includes('+++')) {
    normalized.push('--- a')
    normalized.push('+++ b')
  }

  while (i < lines.length) {
    const line = lines[i]

    // Found a hunk header (valid or invalid)
    if (line.startsWith('@@') || (line.startsWith('---') && i < lines.length - 1 && lines[i + 1].startsWith('+++'))) {
      // Skip file headers if present
      if (line.startsWith('---')) {
        normalized.push(lines[i]) // ---
        normalized.push(lines[i + 1]) // +++
        i += 2
        continue
      }

      // Parse or skip the @@ line and collect hunk body
      i++ // skip current @@ line
      const hunkBody: string[] = []
      while (i < lines.length && !lines[i].startsWith('@@')) {
        const l = lines[i]
        if (l.startsWith(' ') || l.startsWith('-') || l.startsWith('+')) {
          hunkBody.push(l)
        }
        i++
      }

      // Count actual removed/added lines
      const removedCount = hunkBody.filter((l) => l.startsWith('-')).length
      const addedCount = hunkBody.filter((l) => l.startsWith('+')).length

      // Generate correct hunk header
      const header = `@@ -1,${removedCount} +1,${addedCount} @@`
      normalized.push(header)
      normalized.push(...hunkBody)
      continue
    }

    // Pass through other lines
    normalized.push(line)
    i++
  }

  return normalized.join('\n')
}
