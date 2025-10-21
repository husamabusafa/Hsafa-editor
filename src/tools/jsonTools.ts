import type { Dispatch, SetStateAction } from 'react'

export interface ToolResponse {
  success: boolean
  message?: string
  error?: string
  content?: any
  path?: string
  value?: any
  oldValue?: any
  operation?: string
}

interface JsonOperation {
  op: 'set' | 'remove' | 'add' | 'replace' | 'move' | 'copy' | 'test' | 'insert' | 'append' | 'prepend'
  path: string
  value?: any
  from?: string // For move/copy operations
  index?: number // For array insert operations
}

interface SetValueParams {
  path: string
  value: any
}

interface RemoveParams {
  path: string
}

interface AddParams {
  path: string
  key?: string
  value: any
  index?: number
}

interface ReplaceParams {
  path: string
  oldValue?: any
  newValue: any
}

interface MoveParams {
  from: string
  to: string
}

interface CopyParams {
  from: string
  to: string
}

interface TestParams {
  path: string
  value?: any
  condition?: 'exists' | 'equals' | 'type' | 'greater' | 'less' | 'contains'
}

interface BatchParams {
  operations: JsonOperation[]
}

interface QueryParams {
  path: string
}

interface TransformParams {
  path: string
  operation: 'uppercase' | 'lowercase' | 'increment' | 'decrement' | 'multiply' | 'divide' | 'sort' | 'reverse' | 'unique' | 'flatten'
  value?: any
}

export const createJsonTools = (
  getFileContent: () => string,
  setFileContent: Dispatch<SetStateAction<string>>,
  setCode: Dispatch<SetStateAction<string>>
) => {
  
  // Helper: Parse JSON safely
  const parseJson = (content: string): { success: boolean; data?: any; error?: string } => {
    try {
      const data = JSON.parse(content)
      return { success: true, data }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Invalid JSON' 
      }
    }
  }

  // Helper: Stringify JSON with formatting
  const stringifyJson = (data: any): string => {
    return JSON.stringify(data, null, 2)
  }

  // Helper: Parse JSONPath and navigate to parent and key
  const navigateToPath = (obj: any, path: string): { 
    parent: any
    key: string | number
    exists: boolean
    value?: any 
  } => {
    if (path === '$' || path === '') {
      return { parent: null, key: '', exists: true, value: obj }
    }

    // Remove leading $ if present
    const cleanPath = path.startsWith('$.') ? path.slice(2) : path.startsWith('$') ? path.slice(1) : path
    
    if (!cleanPath) {
      return { parent: null, key: '', exists: true, value: obj }
    }

    // Split path by dots and brackets
    const parts = cleanPath.split(/\.|\[|\]/).filter(p => p !== '')
    
    let current = obj
    let parent = null
    let key: string | number = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      parent = current
      
      // Check if it's an array index
      const arrayIndex = parseInt(part)
      if (!isNaN(arrayIndex) && Array.isArray(current)) {
        key = arrayIndex
        if (i === parts.length - 1) {
          return { 
            parent, 
            key, 
            exists: arrayIndex >= 0 && arrayIndex < current.length,
            value: current[arrayIndex]
          }
        }
        current = current[arrayIndex]
      } else {
        key = part
        if (i === parts.length - 1) {
          return { 
            parent, 
            key, 
            exists: current != null && key in current,
            value: current?.[key]
          }
        }
        current = current?.[part]
      }

      if (current == null && i < parts.length - 1) {
        return { parent, key, exists: false }
      }
    }

    return { parent, key, exists: false }
  }

  // Helper: Get value at path
  const getValueAtPath = (obj: any, path: string): any => {
    const { exists, value } = navigateToPath(obj, path)
    return exists ? value : undefined
  }

  // Helper: Set value at path (creates intermediate objects/arrays as needed)
  const setValueAtPath = (obj: any, path: string, value: any): any => {
    if (path === '$' || path === '') {
      return value
    }

    const result = JSON.parse(JSON.stringify(obj)) // Deep clone
    const { parent, key } = navigateToPath(result, path)

    if (parent === null) {
      return value
    }

    if (Array.isArray(parent) && typeof key === 'number') {
      parent[key] = value
    } else if (typeof parent === 'object' && parent !== null) {
      parent[key] = value
    }

    return result
  }

  // Helper: Remove value at path
  const removeValueAtPath = (obj: any, path: string): any => {
    const result = JSON.parse(JSON.stringify(obj))
    const { parent, key, exists } = navigateToPath(result, path)

    if (!exists || parent === null) {
      return result
    }

    if (Array.isArray(parent) && typeof key === 'number') {
      parent.splice(key, 1)
    } else if (typeof parent === 'object' && parent !== null) {
      delete parent[key]
    }

    return result
  }

  // Update file content helper
  const updateContent = (newData: any): void => {
    const newContent = stringifyJson(newData)
    setFileContent(newContent)
    setCode(newContent)
  }

  return {
    // Read current JSON content
    read_json: async (): Promise<ToolResponse> => {
      const content = getFileContent()
      const parsed = parseJson(content)
      
      if (!parsed.success) {
        return {
          success: false,
          error: parsed.error
        }
      }

      return {
        success: true,
        content: parsed.data,
        message: 'JSON content read successfully'
      }
    },

    // Get value at specific path
    get_value: async (params: QueryParams): Promise<ToolResponse> => {
      const content = getFileContent()
      const parsed = parseJson(content)
      
      if (!parsed.success) {
        return { success: false, error: parsed.error }
      }

      const { exists, value } = navigateToPath(parsed.data, params.path)

      return {
        success: true,
        path: params.path,
        value,
        message: exists ? 'Value retrieved' : 'Path does not exist',
        operation: 'get'
      }
    },

    // Set/update value at path
    set_value: async (params: SetValueParams): Promise<ToolResponse> => {
      const content = getFileContent()
      const parsed = parseJson(content)
      
      if (!parsed.success) {
        return { success: false, error: parsed.error }
      }

      const { exists, value: oldValue } = navigateToPath(parsed.data, params.path)
      const newData = setValueAtPath(parsed.data, params.path, params.value)
      updateContent(newData)

      return {
        success: true,
        path: params.path,
        value: params.value,
        oldValue: exists ? oldValue : undefined,
        message: exists ? 'Value updated' : 'Value created',
        operation: 'set'
      }
    },

    // Remove value at path
    remove_value: async (params: RemoveParams): Promise<ToolResponse> => {
      const content = getFileContent()
      const parsed = parseJson(content)
      
      if (!parsed.success) {
        return { success: false, error: parsed.error }
      }

      const { exists, value: oldValue } = navigateToPath(parsed.data, params.path)
      
      if (!exists) {
        return {
          success: false,
          error: `Path does not exist: ${params.path}`,
          path: params.path
        }
      }

      const newData = removeValueAtPath(parsed.data, params.path)
      updateContent(newData)

      return {
        success: true,
        path: params.path,
        oldValue,
        message: 'Value removed',
        operation: 'remove'
      }
    },

    // Add value (to object as new key, or to array)
    add_value: async (params: AddParams): Promise<ToolResponse> => {
      const content = getFileContent()
      const parsed = parseJson(content)
      
      if (!parsed.success) {
        return { success: false, error: parsed.error }
      }

      const target = getValueAtPath(parsed.data, params.path)
      
      if (target == null) {
        return {
          success: false,
          error: `Target path does not exist: ${params.path}`
        }
      }

      let newData: any

      if (Array.isArray(target)) {
        // Add to array at specific index or end
        const newArray = [...target]
        if (params.index != null && params.index >= 0 && params.index <= newArray.length) {
          newArray.splice(params.index, 0, params.value)
        } else {
          newArray.push(params.value)
        }
        newData = setValueAtPath(parsed.data, params.path, newArray)
      } else if (typeof target === 'object') {
        // Add to object
        if (!params.key) {
          return {
            success: false,
            error: 'Key is required when adding to an object'
          }
        }
        const newObject = { ...target, [params.key]: params.value }
        newData = setValueAtPath(parsed.data, params.path, newObject)
      } else {
        return {
          success: false,
          error: 'Target must be an array or object'
        }
      }

      updateContent(newData)

      return {
        success: true,
        path: params.path,
        value: params.value,
        message: Array.isArray(target) 
          ? `Value added to array${params.index != null ? ` at index ${params.index}` : ''}` 
          : `Value added with key "${params.key}"`,
        operation: 'add'
      }
    },

    // Replace value (find and replace in strings, or direct replacement)
    replace_value: async (params: ReplaceParams): Promise<ToolResponse> => {
      const content = getFileContent()
      const parsed = parseJson(content)
      
      if (!parsed.success) {
        return { success: false, error: parsed.error }
      }

      const { exists, value: currentValue } = navigateToPath(parsed.data, params.path)
      
      if (!exists) {
        return {
          success: false,
          error: `Path does not exist: ${params.path}`
        }
      }

      let newValue: any

      if (typeof currentValue === 'string' && params.oldValue != null) {
        // String replacement
        newValue = currentValue.replace(params.oldValue, params.newValue)
      } else {
        // Direct replacement
        newValue = params.newValue
      }

      const newData = setValueAtPath(parsed.data, params.path, newValue)
      updateContent(newData)

      return {
        success: true,
        path: params.path,
        oldValue: currentValue,
        value: newValue,
        message: 'Value replaced',
        operation: 'replace'
      }
    },

    // Move value from one path to another
    move_value: async (params: MoveParams): Promise<ToolResponse> => {
      const content = getFileContent()
      const parsed = parseJson(content)
      
      if (!parsed.success) {
        return { success: false, error: parsed.error }
      }

      const { exists: fromExists, value } = navigateToPath(parsed.data, params.from)
      
      if (!fromExists) {
        return {
          success: false,
          error: `Source path does not exist: ${params.from}`
        }
      }

      // Remove from source and add to destination
      let newData = removeValueAtPath(parsed.data, params.from)
      newData = setValueAtPath(newData, params.to, value)
      updateContent(newData)

      return {
        success: true,
        message: `Value moved from ${params.from} to ${params.to}`,
        value,
        operation: 'move'
      }
    },

    // Copy value from one path to another
    copy_value: async (params: CopyParams): Promise<ToolResponse> => {
      const content = getFileContent()
      const parsed = parseJson(content)
      
      if (!parsed.success) {
        return { success: false, error: parsed.error }
      }

      const { exists, value } = navigateToPath(parsed.data, params.from)
      
      if (!exists) {
        return {
          success: false,
          error: `Source path does not exist: ${params.from}`
        }
      }

      const newData = setValueAtPath(parsed.data, params.to, JSON.parse(JSON.stringify(value)))
      updateContent(newData)

      return {
        success: true,
        message: `Value copied from ${params.from} to ${params.to}`,
        value,
        operation: 'copy'
      }
    },

    // Test value at path
    test_value: async (params: TestParams): Promise<ToolResponse> => {
      const content = getFileContent()
      const parsed = parseJson(content)
      
      if (!parsed.success) {
        return { success: false, error: parsed.error }
      }

      const { exists, value } = navigateToPath(parsed.data, params.path)
      const condition = params.condition || 'exists'
      let testResult = false
      let message = ''

      switch (condition) {
        case 'exists':
          testResult = exists
          message = exists ? 'Path exists' : 'Path does not exist'
          break
        case 'equals':
          testResult = exists && JSON.stringify(value) === JSON.stringify(params.value)
          message = testResult ? 'Values are equal' : 'Values are not equal'
          break
        case 'type':
          const actualType = Array.isArray(value) ? 'array' : typeof value
          testResult = exists && actualType === params.value
          message = testResult ? `Type is ${params.value}` : `Type is ${actualType}, not ${params.value}`
          break
        case 'greater':
          testResult = exists && typeof value === 'number' && value > params.value
          message = testResult ? `${value} > ${params.value}` : `${value} <= ${params.value}`
          break
        case 'less':
          testResult = exists && typeof value === 'number' && value < params.value
          message = testResult ? `${value} < ${params.value}` : `${value} >= ${params.value}`
          break
        case 'contains':
          if (Array.isArray(value)) {
            testResult = value.includes(params.value)
            message = testResult ? 'Array contains value' : 'Array does not contain value'
          } else if (typeof value === 'string') {
            testResult = value.includes(params.value)
            message = testResult ? 'String contains substring' : 'String does not contain substring'
          } else if (typeof value === 'object' && value !== null) {
            testResult = params.value in value
            message = testResult ? 'Object has key' : 'Object does not have key'
          }
          break
      }

      return {
        success: testResult,
        path: params.path,
        value: exists ? value : undefined,
        message,
        operation: 'test'
      }
    },

    // Transform value at path
    transform_value: async (params: TransformParams): Promise<ToolResponse> => {
      const content = getFileContent()
      const parsed = parseJson(content)
      
      if (!parsed.success) {
        return { success: false, error: parsed.error }
      }

      const { exists, value: currentValue } = navigateToPath(parsed.data, params.path)
      
      if (!exists) {
        return {
          success: false,
          error: `Path does not exist: ${params.path}`
        }
      }

      let newValue: any

      try {
        switch (params.operation) {
          case 'uppercase':
            if (typeof currentValue !== 'string') throw new Error('Value must be a string')
            newValue = currentValue.toUpperCase()
            break
          case 'lowercase':
            if (typeof currentValue !== 'string') throw new Error('Value must be a string')
            newValue = currentValue.toLowerCase()
            break
          case 'increment':
            if (typeof currentValue !== 'number') throw new Error('Value must be a number')
            newValue = currentValue + (params.value || 1)
            break
          case 'decrement':
            if (typeof currentValue !== 'number') throw new Error('Value must be a number')
            newValue = currentValue - (params.value || 1)
            break
          case 'multiply':
            if (typeof currentValue !== 'number') throw new Error('Value must be a number')
            newValue = currentValue * (params.value || 1)
            break
          case 'divide':
            if (typeof currentValue !== 'number') throw new Error('Value must be a number')
            if (params.value === 0) throw new Error('Cannot divide by zero')
            newValue = currentValue / (params.value || 1)
            break
          case 'sort':
            if (!Array.isArray(currentValue)) throw new Error('Value must be an array')
            newValue = [...currentValue].sort()
            break
          case 'reverse':
            if (!Array.isArray(currentValue)) throw new Error('Value must be an array')
            newValue = [...currentValue].reverse()
            break
          case 'unique':
            if (!Array.isArray(currentValue)) throw new Error('Value must be an array')
            newValue = [...new Set(currentValue)]
            break
          case 'flatten':
            if (!Array.isArray(currentValue)) throw new Error('Value must be an array')
            newValue = currentValue.flat(params.value || 1)
            break
          default:
            throw new Error(`Unknown operation: ${params.operation}`)
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Transform failed'
        }
      }

      const newData = setValueAtPath(parsed.data, params.path, newValue)
      updateContent(newData)

      return {
        success: true,
        path: params.path,
        oldValue: currentValue,
        value: newValue,
        message: `Transformed with ${params.operation}`,
        operation: 'transform'
      }
    },

    // Batch operations
    batch_operations: async (params: BatchParams): Promise<ToolResponse> => {
      const content = getFileContent()
      const parsed = parseJson(content)
      
      if (!parsed.success) {
        return { success: false, error: parsed.error }
      }

      let data = parsed.data
      const results: any[] = []

      for (const op of params.operations) {
        try {
          switch (op.op) {
            case 'set':
              data = setValueAtPath(data, op.path, op.value)
              results.push({ success: true, op: 'set', path: op.path })
              break
            case 'remove':
              data = removeValueAtPath(data, op.path)
              results.push({ success: true, op: 'remove', path: op.path })
              break
            case 'move':
              const moveValue = getValueAtPath(data, op.from!)
              data = removeValueAtPath(data, op.from!)
              data = setValueAtPath(data, op.path, moveValue)
              results.push({ success: true, op: 'move', from: op.from, to: op.path })
              break
            case 'copy':
              const copyValue = getValueAtPath(data, op.from!)
              data = setValueAtPath(data, op.path, JSON.parse(JSON.stringify(copyValue)))
              results.push({ success: true, op: 'copy', from: op.from, to: op.path })
              break
            case 'add':
              const target = getValueAtPath(data, op.path)
              if (Array.isArray(target)) {
                // Add to array
                const newArray = [...target]
                if (op.index != null && op.index >= 0 && op.index <= newArray.length) {
                  newArray.splice(op.index, 0, op.value)
                } else {
                  newArray.push(op.value)
                }
                data = setValueAtPath(data, op.path, newArray)
                results.push({ success: true, op: 'add', path: op.path })
              } else {
                // For non-arrays in batch, use set operation instead
                data = setValueAtPath(data, op.path, op.value)
                results.push({ success: true, op: 'add', path: op.path, note: 'Used set for non-array target' })
              }
              break
            case 'replace':
              const currentVal = getValueAtPath(data, op.path)
              let newVal: any
              if (typeof currentVal === 'string' && op.from != null) {
                newVal = currentVal.replace(op.from, op.value)
              } else {
                newVal = op.value
              }
              data = setValueAtPath(data, op.path, newVal)
              results.push({ success: true, op: 'replace', path: op.path })
              break
            default:
              results.push({ success: false, op: op.op, error: 'Unknown operation' })
          }
        } catch (error) {
          results.push({ 
            success: false, 
            op: op.op, 
            error: error instanceof Error ? error.message : 'Operation failed' 
          })
        }
      }

      updateContent(data)

      return {
        success: true,
        message: `Executed ${params.operations.length} operations`,
        content: results,
        operation: 'batch'
      }
    }
  }
}
