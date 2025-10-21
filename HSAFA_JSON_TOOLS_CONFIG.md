# JSON Tools Configuration for Hsafa Panel

## Complete Tool Definitions (Ready to Copy)

```typescript
import { z } from 'zod'

const jsonTools = [
  {
    name: 'read_json',
    description: 'Read and parse the entire JSON document from the editor. Returns the complete JSON structure. Use this to understand the document structure before making changes.',
    parameters: z.object({}),
  },
  
  {
    name: 'get_value',
    description: 'Retrieve a value at a specific JSONPath. Supports nested objects ($.config.port), array access ($.items[0]), and deep paths ($.author.contact.email). Returns the value and whether the path exists.',
    parameters: z.object({
      path: z.string().describe('JSONPath to the value. Examples: "$.name", "$.config.port", "$.items[0]", "$.author.email"'),
    }),
  },
  
  {
    name: 'set_value',
    description: 'Set or update a value at a specific JSONPath. Creates the path if it doesn\'t exist. Works with all JSON types: strings, numbers, booleans, objects, arrays, and null. Use this for creating new properties or updating existing ones.',
    parameters: z.object({
      path: z.string().describe('JSONPath where to set the value. Examples: "$.config.port", "$.author.name", "$.items[2]"'),
      value: z.any().describe('The value to set. Can be any valid JSON type: string, number, boolean, object, array, or null'),
    }),
  },
  
  {
    name: 'remove_value',
    description: 'Remove a property from an object or element from an array at the specified JSONPath. For arrays, removing an element shifts remaining elements down. Returns an error if the path doesn\'t exist.',
    parameters: z.object({
      path: z.string().describe('JSONPath to remove. Examples: "$.oldField", "$.config.deprecated", "$.items[1]"'),
    }),
  },
  
  {
    name: 'add_value',
    description: 'Add a value to an object (as a new property with specified key) or to an array (append to end or insert at specific index). For objects, the "key" parameter is required. For arrays, omit "index" to append, or provide "index" to insert at that position.',
    parameters: z.object({
      path: z.string().describe('JSONPath to the target object or array. Examples: "$.config", "$.dependencies", "$.users"'),
      value: z.any().describe('The value to add. Can be any valid JSON type'),
      key: z.string().optional().describe('Property name when adding to an object. Required for objects, not used for arrays.'),
      index: z.number().int().min(0).optional().describe('Position to insert in array (0-based). If omitted, appends to end. Only used for arrays.'),
    }),
  },
  
  {
    name: 'replace_value',
    description: 'Replace a value at a path. For strings, can perform substring replacement by providing oldValue. For other types, performs direct replacement with newValue. Use this for text replacements or complete value updates.',
    parameters: z.object({
      path: z.string().describe('JSONPath to the value to replace. Examples: "$.description", "$.version", "$.config.mode"'),
      newValue: z.any().describe('The new value to set'),
      oldValue: z.any().optional().describe('For string replacement: the substring to find and replace. If provided, does string.replace(oldValue, newValue)'),
    }),
  },
  
  {
    name: 'move_value',
    description: 'Move a value from one JSONPath to another. The value is removed from the source path and created at the destination path. Use this for restructuring data or renaming keys.',
    parameters: z.object({
      from: z.string().describe('Source JSONPath to move from. Examples: "$.oldLocation", "$.temp.data"'),
      to: z.string().describe('Destination JSONPath to move to. Examples: "$.newLocation", "$.permanent.data"'),
    }),
  },
  
  {
    name: 'copy_value',
    description: 'Copy a value from one JSONPath to another. The original value remains at the source path, and a deep clone is created at the destination. Use this for duplicating configuration or backing up data.',
    parameters: z.object({
      from: z.string().describe('Source JSONPath to copy from. Examples: "$.config.production", "$.template"'),
      to: z.string().describe('Destination JSONPath to copy to. Examples: "$.config.staging", "$.instances[0]"'),
    }),
  },
  
  {
    name: 'test_value',
    description: 'Test a condition on a value at a JSONPath. Supports multiple conditions: "exists" (path exists), "equals" (value matches), "type" (checks type), "greater"/"less" (numeric comparison), "contains" (array/string/object membership). Returns success: true if condition passes, false otherwise.',
    parameters: z.object({
      path: z.string().describe('JSONPath to test. Examples: "$.config.enabled", "$.stats.count", "$.features"'),
      condition: z.enum(['exists', 'equals', 'type', 'greater', 'less', 'contains']).optional().describe('Test condition. Default: "exists". Options: exists (path exists), equals (value == value param), type (typeof matches value param), greater (number > value param), less (number < value param), contains (array/string/object contains value param)'),
      value: z.any().optional().describe('Value to test against. Required for: equals, type, greater, less, contains. For "type", use: "string", "number", "boolean", "object", "array", "null"'),
    }),
  },
  
  {
    name: 'transform_value',
    description: 'Apply transformations to a value at a JSONPath. String operations: uppercase, lowercase. Numeric operations: increment, decrement, multiply, divide (with optional value parameter). Array operations: sort, reverse, unique (remove duplicates), flatten (with optional depth).',
    parameters: z.object({
      path: z.string().describe('JSONPath to the value to transform. Examples: "$.title", "$.count", "$.tags"'),
      operation: z.enum(['uppercase', 'lowercase', 'increment', 'decrement', 'multiply', 'divide', 'sort', 'reverse', 'unique', 'flatten']).describe('Transform operation. String ops: uppercase, lowercase. Number ops: increment, decrement, multiply, divide. Array ops: sort, reverse, unique, flatten'),
      value: z.any().optional().describe('Parameter for operation. For increment/decrement: amount (default 1). For multiply/divide: factor (default 1). For flatten: depth (default 1). Not used for: uppercase, lowercase, sort, reverse, unique'),
    }),
  },
  
  {
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
      ).describe('Array of operations to execute in sequence'),
    }),
  },
]
```

---

## Quick Summary Table

| Tool Name | Purpose | Key Parameters |
|-----------|---------|----------------|
| **read_json** | Read entire document | None |
| **get_value** | Get value at path | `path` |
| **set_value** | Create/update value | `path`, `value` |
| **remove_value** | Delete value | `path` |
| **add_value** | Add to object/array | `path`, `value`, `key?`, `index?` |
| **replace_value** | Replace value/substring | `path`, `newValue`, `oldValue?` |
| **move_value** | Move data | `from`, `to` |
| **copy_value** | Duplicate data | `from`, `to` |
| **test_value** | Validate condition | `path`, `condition?`, `value?` |
| **transform_value** | Transform value | `path`, `operation`, `value?` |
| **batch_operations** | Multiple ops | `operations[]` |

---

## JSONPath Examples

```javascript
// Root
"$"

// Top-level properties
"$.name"
"$.version"

// Nested objects
"$.config.port"
"$.author.email"
"$.settings.api.timeout"

// Array elements (0-indexed)
"$.dependencies[0]"
"$.users[2]"
"$.items[10]"

// Deep nesting with arrays
"$.data.results[0].user.name"
"$.config.servers[1].host"
```

---

## Transform Operations

### String Operations
- `uppercase` - Convert to UPPERCASE
- `lowercase` - Convert to lowercase

### Numeric Operations
- `increment` - Add value (default: 1)
- `decrement` - Subtract value (default: 1)
- `multiply` - Multiply by value (default: 1)
- `divide` - Divide by value (default: 1)

### Array Operations
- `sort` - Sort array elements
- `reverse` - Reverse array order
- `unique` - Remove duplicates
- `flatten` - Flatten nested arrays (depth from value param)

---

## Test Conditions

| Condition | Description | Example |
|-----------|-------------|---------|
| `exists` | Path exists in document | `{ path: "$.config", condition: "exists" }` |
| `equals` | Value equals parameter | `{ path: "$.version", condition: "equals", value: "1.0.0" }` |
| `type` | Type matches parameter | `{ path: "$.count", condition: "type", value: "number" }` |
| `greater` | Number > parameter | `{ path: "$.score", condition: "greater", value: 100 }` |
| `less` | Number < parameter | `{ path: "$.age", condition: "less", value: 18 }` |
| `contains` | Array/string/object contains | `{ path: "$.tags", condition: "contains", value: "react" }` |

---

## Batch Operation Types

```typescript
// Available operations in batch_operations:
{
  op: 'set',      // Set value at path
  path: string,
  value: any
}

{
  op: 'remove',   // Remove value at path
  path: string
}

{
  op: 'add',      // Add to array (or set for non-arrays)
  path: string,
  value: any,
  index?: number  // Optional: position in array
}

{
  op: 'replace',  // Replace value (substring for strings)
  path: string,
  value: any,
  from?: string   // Optional: substring to replace in strings
}

{
  op: 'move',     // Move value
  from: string,
  path: string    // destination
}

{
  op: 'copy',     // Copy value
  from: string,
  path: string    // destination
}

// Example batch:
{
  operations: [
    { op: 'set', path: '$.version', value: '2.0.0' },
    { op: 'add', path: '$.dependencies', value: 'lodash' },
    { op: 'replace', path: '$.description', value: 'production', from: 'test' },
    { op: 'remove', path: '$.deprecated' },
    { op: 'copy', from: '$.config', path: '$.backup' }
  ]
}
```

---

## Integration Code

```typescript
// In your Hsafa agent configuration:

import { z } from 'zod'
import { createJsonTools } from './tools/jsonTools'

// Create the tools instance
const jsonToolsInstance = createJsonTools(
  getFileContent,
  setFileContent,
  setCode
)

// Register tools with schemas
const hsafaTools = {
  // ... tool definitions from above ...
  read_json: jsonToolsInstance.read_json,
  get_value: jsonToolsInstance.get_value,
  set_value: jsonToolsInstance.set_value,
  remove_value: jsonToolsInstance.remove_value,
  add_value: jsonToolsInstance.add_value,
  replace_value: jsonToolsInstance.replace_value,
  move_value: jsonToolsInstance.move_value,
  copy_value: jsonToolsInstance.copy_value,
  test_value: jsonToolsInstance.test_value,
  transform_value: jsonToolsInstance.transform_value,
  batch_operations: jsonToolsInstance.batch_operations,
}
```

---

## System Prompt Recommendation

Add this to your JSON agent's system prompt:

```
You are a JSON manipulation assistant with access to advanced tools. Follow these guidelines:

1. Always use complete JSONPaths starting with "$" (e.g., "$.config.port")
2. For array access, use zero-based indexing (e.g., "$.items[0]")
3. Use batch_operations for multiple related changes
4. Call get_value or read_json before destructive operations
5. Use test_value to verify conditions before updates
6. For numeric changes, prefer transform_value (increment/decrement)
7. For array manipulations, use add_value with index parameter

JSONPath Syntax:
- Root: $
- Object property: $.name
- Nested: $.config.port
- Array element: $.items[0]
- Deep path: $.data.user.settings.theme
```
