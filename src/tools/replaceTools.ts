import type { Dispatch, SetStateAction } from 'react'

export interface EditParams {
  old_string: string
  new_string: string
  replace_all?: boolean
  explanation: string
}

export interface MultiEditParams {
  edits: Array<{
    old_string: string
    new_string: string
    replace_all?: boolean
  }>
  explanation: string
}

export interface ToolResponse {
  success: boolean
  message?: string
  error?: string
  explanation?: string
  changes?: string
  results?: string[]
  completedEdits?: number
  content?: string
  lines?: number
}

export const createReplaceTools = (
  getFileContent: () => string,
  setFileContent: Dispatch<SetStateAction<string>>,
  setCode: Dispatch<SetStateAction<string>>
) => ({
  edit:{
    tool:  async (params: EditParams): Promise<ToolResponse> => {
    try {
      const { old_string, new_string, replace_all = false, explanation } = params
      const fileContent = getFileContent() // Get current content

      // Validate that strings are different
      if (old_string === new_string) {
        return {
          success: false,
          error: 'old_string and new_string must be different',
          explanation
        }
      }

      // Check if old_string exists in file
      if (!fileContent.includes(old_string)) {
        return {
          success: false,
          error: 'old_string not found in file',
          explanation
        }
      }

      // Check uniqueness if replace_all is false
      if (!replace_all) {
        const occurrences = fileContent.split(old_string).length - 1
        if (occurrences > 1) {
          return {
            success: false,
            error: `old_string appears ${occurrences} times. Use replace_all: true or provide a more specific string`,
            explanation
          }
        }
      }

      // Perform replacement
      const newContent = replace_all
        ? fileContent.replaceAll(old_string, new_string)
        : fileContent.replace(old_string, new_string)

      setFileContent(newContent)
      setCode(newContent)

      return {
        success: true,
        message: `Successfully applied edit: ${explanation}`,
        changes: replace_all
          ? `Replaced all occurrences`
          : 'Replaced 1 occurrence',
        explanation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        explanation: params.explanation
      }
    }
  },
  executeEachToken: true
},

  multi_edit: {
    tool: async (params: MultiEditParams): Promise<ToolResponse> => {
    try {
      const { edits, explanation } = params
      let currentContent = getFileContent() // Get current content
      const results: string[] = []

      // Apply edits sequentially
      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i]
        const { old_string, new_string, replace_all = false } = edit

        // Validate that strings are different
        if (old_string === new_string) {
          return {
            success: false,
            error: `Edit ${i + 1}: old_string and new_string must be different`,
            explanation
          }
        }

        // Check if old_string exists
        if (!currentContent.includes(old_string)) {
          return {
            success: false,
            error: `Edit ${i + 1}: old_string not found in current content`,
            explanation,
            completedEdits: i
          }
        }

        // Check uniqueness if replace_all is false
        if (!replace_all) {
          const occurrences = currentContent.split(old_string).length - 1
          if (occurrences > 1) {
            return {
              success: false,
              error: `Edit ${i + 1}: old_string appears ${occurrences} times. Use replace_all: true or provide a more specific string`,
              explanation,
              completedEdits: i
            }
          }
        }

        // Perform replacement
        currentContent = replace_all
          ? currentContent.replaceAll(old_string, new_string)
          : currentContent.replace(old_string, new_string)

        results.push(`Edit ${i + 1}: ${replace_all ? 'Replaced all occurrences' : 'Replaced 1 occurrence'}`)
      }

      // All edits successful, update state
      setFileContent(currentContent)
      setCode(currentContent)

      return {
        success: true,
        message: `Successfully applied ${edits.length} edits: ${explanation}`,
        results,
        explanation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        explanation: params.explanation
      }
    }
  },
  executeEachToken: true
},

  read_file: async (): Promise<ToolResponse> => {
    const fileContent = getFileContent() // Get current content
    return {
      success: true,
      content: fileContent,
      lines: fileContent.split('\n').length
    }
  }
})
