import { z } from 'zod'

/**
 * JSON Tools Schema Definitions for Hsafa Panel
 * 
 * Import and use these schemas to register tools in the Hsafa agent configuration
 */

export const jsonToolsSchema = {
  read_json: {
    name: 'read_json',
    description: 'Read and parse the entire JSON document from the editor. Returns the complete JSON structure. Use this to understand the document structure before making changes.',
    parameters: z.object({}).optional(),
  },

  get_value: {
    name: 'get_value',
    description: 'Retrieve a value at a specific JSONPath. Supports nested objects ($.config.port), array access ($.items[0]), and deep paths ($.author.contact.email). Returns the value and whether the path exists.',
    parameters: z.object({
      path: z.string().describe('JSONPath to the value. Examples: "$.name", "$.config.port", "$.items[0]", "$.author.email"'),
    }),
  },

  set_value: {
    name: 'set_value',
    description: 'Set or update a value at a specific JSONPath. Creates the path if it doesn\'t exist. Works with all JSON types: strings, numbers, booleans, objects, arrays, and null. Use this for creating new properties or updating existing ones.',
    parameters: z.object({
      path: z.string().describe('JSONPath where to set the value. Examples: "$.config.port", "$.author.name", "$.items[2]"'),
      value: z.any().describe('The value to set. Can be any valid JSON type: string, number, boolean, object, array, or null'),
    }),
  },

  remove_value: {
    name: 'remove_value',
    description: 'Remove a property from an object or element from an array at the specified JSONPath. For arrays, removing an element shifts remaining elements down. Returns an error if the path doesn\'t exist.',
    parameters: z.object({
      path: z.string().describe('JSONPath to remove. Examples: "$.oldField", "$.config.deprecated", "$.items[1]"'),
    }),
  },

  add_value: {
    name: 'add_value',
    description: 'Add a value to an object (as a new property with specified key) or to an array (append to end or insert at specific index). For objects, the "key" parameter is required. For arrays, omit "index" to append, or provide "index" to insert at that position.',
    parameters: z.object({
      path: z.string().describe('JSONPath to the target object or array. Examples: "$.config", "$.dependencies", "$.users"'),
      value: z.any().describe('The value to add. Can be any valid JSON type'),
      key: z.string().optional().describe('Property name when adding to an object. Required for objects, not used for arrays.'),
      index: z.number().int().min(0).optional().describe('Position to insert in array (0-based). If omitted, appends to end. Only used for arrays.'),
    }),
  },

  replace_value: {
    name: 'replace_value',
    description: 'Replace a value at a path. For strings, can perform substring replacement by providing oldValue. For other types, performs direct replacement with newValue. Use this for text replacements or complete value updates.',
    parameters: z.object({
      path: z.string().describe('JSONPath to the value to replace. Examples: "$.description", "$.version", "$.config.mode"'),
      newValue: z.any().describe('The new value to set'),
      oldValue: z.any().optional().describe('For string replacement: the substring to find and replace. If provided, does string.replace(oldValue, newValue)'),
    }),
  },

  move_value: {
    name: 'move_value',
    description: 'Move a value from one JSONPath to another. The value is removed from the source path and created at the destination path. Use this for restructuring data or renaming keys.',
    parameters: z.object({
      from: z.string().describe('Source JSONPath to move from. Examples: "$.oldLocation", "$.temp.data"'),
      to: z.string().describe('Destination JSONPath to move to. Examples: "$.newLocation", "$.permanent.data"'),
    }),
  },

  copy_value: {
    name: 'copy_value',
    description: 'Copy a value from one JSONPath to another. The original value remains at the source path, and a deep clone is created at the destination. Use this for duplicating configuration or backing up data.',
    parameters: z.object({
      from: z.string().describe('Source JSONPath to copy from. Examples: "$.config.production", "$.template"'),
      to: z.string().describe('Destination JSONPath to copy to. Examples: "$.config.staging", "$.instances[0]"'),
    }),
  },

  test_value: {
    name: 'test_value',
    description: 'Test a condition on a value at a JSONPath. Supports multiple conditions: "exists" (path exists), "equals" (value matches), "type" (checks type), "greater"/"less" (numeric comparison), "contains" (array/string/object membership). Returns success: true if condition passes, false otherwise.',
    parameters: z.object({
      path: z.string().describe('JSONPath to test. Examples: "$.config.enabled", "$.stats.count", "$.features"'),
      condition: z.enum(['exists', 'equals', 'type', 'greater', 'less', 'contains']).optional().describe('Test condition. Default: "exists". Options: exists (path exists), equals (value == value param), type (typeof matches value param), greater (number > value param), less (number < value param), contains (array/string/object contains value param)'),
      value: z.any().optional().describe('Value to test against. Required for: equals, type, greater, less, contains. For "type", use: "string", "number", "boolean", "object", "array", "null"'),
    }),
  },

  transform_value: {
    name: 'transform_value',
    description: 'Apply transformations to a value at a JSONPath. String operations: uppercase, lowercase. Numeric operations: increment, decrement, multiply, divide (with optional value parameter). Array operations: sort, reverse, unique (remove duplicates), flatten (with optional depth).',
    parameters: z.object({
      path: z.string().describe('JSONPath to the value to transform. Examples: "$.title", "$.count", "$.tags"'),
      operation: z.enum(['uppercase', 'lowercase', 'increment', 'decrement', 'multiply', 'divide', 'sort', 'reverse', 'unique', 'flatten']).describe('Transform operation. String ops: uppercase, lowercase. Number ops: increment, decrement, multiply, divide. Array ops: sort, reverse, unique, flatten'),
      value: z.any().optional().describe('Parameter for operation. For increment/decrement: amount (default 1). For multiply/divide: factor (default 1). For flatten: depth (default 1). Not used for: uppercase, lowercase, sort, reverse, unique'),
    }),
  },

  batch_operations: {
    name: 'batch_operations',
    description: 'Execute multiple JSON operations atomically in a single transaction. All operations are applied in sequence. If any operation fails, it reports the failure but continues with remaining operations. Use this for complex updates, data migrations, or multiple related changes.',
    parameters: z.object({
      operations: z.array(
        z.object({
          op: z.enum(['set', 'remove', 'add', 'replace', 'move', 'copy']).describe('Operation type'),
          path: z.string().describe('Target JSONPath for the operation'),
          value: z.any().optional().describe('Value for set/add/replace operations'),
          from: z.string().optional().describe('Source path for move/copy operations'),
          index: z.number().optional().describe('Array index for add operation'),
        })
      ).describe('Array of operations to execute in sequence. Each operation has: op (operation type), path (target), and optional value/from/index depending on operation'),
    }),
  },
}

/**
 * Example usage in Hsafa agent configuration:
 * 
 * import { jsonToolsSchema } from './tools/jsonToolsSchema'
 * 
 * const tools = [
 *   {
 *     name: jsonToolsSchema.read_json.name,
 *     description: jsonToolsSchema.read_json.description,
 *     parameters: jsonToolsSchema.read_json.parameters,
 *   },
 *   {
 *     name: jsonToolsSchema.get_value.name,
 *     description: jsonToolsSchema.get_value.description,
 *     parameters: jsonToolsSchema.get_value.parameters,
 *   },
 *   // ... add remaining tools
 * ]
 */

/**
 * Helper to convert all schemas to array format
 */
export const getAllJsonToolSchemas = () => {
  return Object.values(jsonToolsSchema).map(schema => ({
    name: schema.name,
    description: schema.description,
    parameters: schema.parameters,
  }))
}

/**
 * Type-safe tool names
 */
export type JsonToolName = keyof typeof jsonToolsSchema

/**
 * Example tool definitions for copy-paste:
 */
export const exampleToolDefinitions = `
// JSON Tools for Hsafa Panel

import { jsonToolsSchema } from './tools/jsonToolsSchema'

const jsonTools = [
  {
    name: 'read_json',
    description: 'Read and parse the entire JSON document from the editor',
    parameters: z.object({}),
  },
  {
    name: 'get_value',
    description: 'Retrieve a value at a specific JSONPath',
    parameters: z.object({
      path: z.string().describe('JSONPath to the value'),
    }),
  },
  {
    name: 'set_value',
    description: 'Set or update a value at a specific JSONPath',
    parameters: z.object({
      path: z.string().describe('JSONPath where to set the value'),
      value: z.any().describe('The value to set'),
    }),
  },
  {
    name: 'remove_value',
    description: 'Remove a property or array element at the specified JSONPath',
    parameters: z.object({
      path: z.string().describe('JSONPath to remove'),
    }),
  },
  {
    name: 'add_value',
    description: 'Add a value to an object or array',
    parameters: z.object({
      path: z.string().describe('JSONPath to the target object or array'),
      value: z.any().describe('The value to add'),
      key: z.string().optional().describe('Property name for objects'),
      index: z.number().optional().describe('Array index for insertion'),
    }),
  },
  {
    name: 'replace_value',
    description: 'Replace a value or substring at a path',
    parameters: z.object({
      path: z.string().describe('JSONPath to the value'),
      newValue: z.any().describe('The new value'),
      oldValue: z.any().optional().describe('Substring to replace (for strings)'),
    }),
  },
  {
    name: 'move_value',
    description: 'Move a value from one path to another',
    parameters: z.object({
      from: z.string().describe('Source JSONPath'),
      to: z.string().describe('Destination JSONPath'),
    }),
  },
  {
    name: 'copy_value',
    description: 'Copy a value from one path to another',
    parameters: z.object({
      from: z.string().describe('Source JSONPath'),
      to: z.string().describe('Destination JSONPath'),
    }),
  },
  {
    name: 'test_value',
    description: 'Test a condition on a value at a JSONPath',
    parameters: z.object({
      path: z.string().describe('JSONPath to test'),
      condition: z.enum(['exists', 'equals', 'type', 'greater', 'less', 'contains']).optional(),
      value: z.any().optional().describe('Value to test against'),
    }),
  },
  {
    name: 'transform_value',
    description: 'Apply transformations to a value',
    parameters: z.object({
      path: z.string().describe('JSONPath to transform'),
      operation: z.enum(['uppercase', 'lowercase', 'increment', 'decrement', 'multiply', 'divide', 'sort', 'reverse', 'unique', 'flatten']),
      value: z.any().optional().describe('Operation parameter'),
    }),
  },
  {
    name: 'batch_operations',
    description: 'Execute multiple JSON operations atomically',
    parameters: z.object({
      operations: z.array(z.object({
        op: z.enum(['set', 'remove', 'add', 'replace', 'move', 'copy']),
        path: z.string(),
        value: z.any().optional(),
        from: z.string().optional(),
        index: z.number().optional(),
      })),
    }),
  },
]
`
