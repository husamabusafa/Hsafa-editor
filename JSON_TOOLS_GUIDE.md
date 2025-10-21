# JSON Tools Agent Guide

This guide provides comprehensive documentation for the advanced JSON manipulation tools available in the JSON tab.

## Overview

The JSON tools provide powerful operations for manipulating JSON documents using JSONPath-like syntax. All operations are performed on the JSON document loaded in the editor.

---

## JSONPath Syntax

### Basic Paths
- `$` - Root of the document
- `$.name` - Top-level property "name"
- `$.author.name` - Nested property
- `$.dependencies[0]` - First element of "dependencies" array
- `$.config.features.auth` - Deeply nested property

### Examples
```json
{
  "name": "My Project",
  "author": {
    "name": "John Doe"
  },
  "dependencies": ["react", "vue"]
}
```

- `$.name` → `"My Project"`
- `$.author.name` → `"John Doe"`
- `$.dependencies[0]` → `"react"`

---

## Available Tools

### 1. `read_json`
Read the entire JSON document.

**Parameters:** None

**Example:**
```json
{
  "tool": "read_json"
}
```

**Response:**
```json
{
  "success": true,
  "content": { /* entire JSON document */ },
  "message": "JSON content read successfully"
}
```

---

### 2. `get_value`
Retrieve a value at a specific path.

**Parameters:**
- `path` (string, required): JSONPath to the value

**Examples:**
```json
{
  "tool": "get_value",
  "params": {
    "path": "$.config.port"
  }
}
```

**Response:**
```json
{
  "success": true,
  "path": "$.config.port",
  "value": 3000,
  "message": "Value retrieved"
}
```

---

### 3. `set_value`
Set or update a value at a specific path. Creates the path if it doesn't exist.

**Parameters:**
- `path` (string, required): JSONPath where to set the value
- `value` (any, required): The value to set

**Examples:**

**Update existing value:**
```json
{
  "tool": "set_value",
  "params": {
    "path": "$.config.port",
    "value": 8080
  }
}
```

**Create new property:**
```json
{
  "tool": "set_value",
  "params": {
    "path": "$.newField",
    "value": "new value"
  }
}
```

**Set nested object:**
```json
{
  "tool": "set_value",
  "params": {
    "path": "$.config.database",
    "value": {
      "host": "localhost",
      "port": 5432
    }
  }
}
```

**Update array element:**
```json
{
  "tool": "set_value",
  "params": {
    "path": "$.dependencies[0]",
    "value": "react@18.0.0"
  }
}
```

---

### 4. `remove_value`
Remove a value at a specific path.

**Parameters:**
- `path` (string, required): JSONPath to remove

**Examples:**

**Remove object property:**
```json
{
  "tool": "remove_value",
  "params": {
    "path": "$.config.debug"
  }
}
```

**Remove array element:**
```json
{
  "tool": "remove_value",
  "params": {
    "path": "$.dependencies[1]"
  }
}
```

---

### 5. `add_value`
Add a value to an object (as a new property) or array (append or insert).

**Parameters:**
- `path` (string, required): JSONPath to the target object/array
- `value` (any, required): The value to add
- `key` (string, optional): Property name when adding to object
- `index` (number, optional): Position when inserting into array

**Examples:**

**Add to object:**
```json
{
  "tool": "add_value",
  "params": {
    "path": "$.config",
    "key": "timeout",
    "value": 5000
  }
}
```

**Append to array:**
```json
{
  "tool": "add_value",
  "params": {
    "path": "$.dependencies",
    "value": "axios"
  }
}
```

**Insert into array at index:**
```json
{
  "tool": "add_value",
  "params": {
    "path": "$.tags",
    "value": "production",
    "index": 0
  }
}
```

---

### 6. `replace_value`
Replace a value. For strings, can do substring replacement.

**Parameters:**
- `path` (string, required): JSONPath to the value
- `newValue` (any, required): The new value
- `oldValue` (any, optional): For string replacement, the substring to replace

**Examples:**

**Direct replacement:**
```json
{
  "tool": "replace_value",
  "params": {
    "path": "$.version",
    "newValue": "2.0.0"
  }
}
```

**String replacement:**
```json
{
  "tool": "replace_value",
  "params": {
    "path": "$.description",
    "oldValue": "sample",
    "newValue": "production"
  }
}
```

---

### 7. `move_value`
Move a value from one path to another.

**Parameters:**
- `from` (string, required): Source JSONPath
- `to` (string, required): Destination JSONPath

**Example:**
```json
{
  "tool": "move_value",
  "params": {
    "from": "$.config.tempSetting",
    "to": "$.settings.tempSetting"
  }
}
```

---

### 8. `copy_value`
Copy a value from one path to another (keeps original).

**Parameters:**
- `from` (string, required): Source JSONPath
- `to` (string, required): Destination JSONPath

**Example:**
```json
{
  "tool": "copy_value",
  "params": {
    "from": "$.config.port",
    "to": "$.config.backupPort"
  }
}
```

---

### 9. `test_value`
Test conditions on a value at a path.

**Parameters:**
- `path` (string, required): JSONPath to test
- `condition` (string, optional): Test condition (default: "exists")
  - `exists` - Check if path exists
  - `equals` - Check if value equals `value` parameter
  - `type` - Check if value type matches `value` parameter
  - `greater` - Check if numeric value > `value` parameter
  - `less` - Check if numeric value < `value` parameter
  - `contains` - Check if array/string/object contains `value`
- `value` (any, optional): Value to test against

**Examples:**

**Test existence:**
```json
{
  "tool": "test_value",
  "params": {
    "path": "$.config.debug",
    "condition": "exists"
  }
}
```

**Test equality:**
```json
{
  "tool": "test_value",
  "params": {
    "path": "$.version",
    "condition": "equals",
    "value": "1.0.0"
  }
}
```

**Test type:**
```json
{
  "tool": "test_value",
  "params": {
    "path": "$.stats.downloads",
    "condition": "type",
    "value": "number"
  }
}
```

**Test numeric comparison:**
```json
{
  "tool": "test_value",
  "params": {
    "path": "$.stats.stars",
    "condition": "greater",
    "value": 100
  }
}
```

**Test contains (array):**
```json
{
  "tool": "test_value",
  "params": {
    "path": "$.tags",
    "condition": "contains",
    "value": "frontend"
  }
}
```

---

### 10. `transform_value`
Apply transformations to values.

**Parameters:**
- `path` (string, required): JSONPath to transform
- `operation` (string, required): Transform operation
  - String operations: `uppercase`, `lowercase`
  - Numeric operations: `increment`, `decrement`, `multiply`, `divide`
  - Array operations: `sort`, `reverse`, `unique`, `flatten`
- `value` (any, optional): Parameter for the operation (e.g., increment amount)

**Examples:**

**Uppercase string:**
```json
{
  "tool": "transform_value",
  "params": {
    "path": "$.name",
    "operation": "uppercase"
  }
}
```

**Increment number:**
```json
{
  "tool": "transform_value",
  "params": {
    "path": "$.stats.downloads",
    "operation": "increment",
    "value": 100
  }
}
```

**Multiply number:**
```json
{
  "tool": "transform_value",
  "params": {
    "path": "$.config.port",
    "operation": "multiply",
    "value": 2
  }
}
```

**Sort array:**
```json
{
  "tool": "transform_value",
  "params": {
    "path": "$.tags",
    "operation": "sort"
  }
}
```

**Remove duplicates:**
```json
{
  "tool": "transform_value",
  "params": {
    "path": "$.dependencies",
    "operation": "unique"
  }
}
```

**Flatten nested array:**
```json
{
  "tool": "transform_value",
  "params": {
    "path": "$.nestedArray",
    "operation": "flatten",
    "value": 1
  }
}
```

---

### 11. `batch_operations`
Execute multiple operations in a single transaction.

**Parameters:**
- `operations` (array, required): Array of operation objects

**Operation Object:**
- `op` (string): Operation type (`set`, `remove`, `move`, `copy`)
- `path` (string): Target path
- `value` (any, optional): Value for set operations
- `from` (string, optional): Source path for move/copy operations

**Example:**
```json
{
  "tool": "batch_operations",
  "params": {
    "operations": [
      {
        "op": "set",
        "path": "$.version",
        "value": "2.0.0"
      },
      {
        "op": "set",
        "path": "$.config.debug",
        "value": false
      },
      {
        "op": "remove",
        "path": "$.deprecated"
      },
      {
        "op": "copy",
        "from": "$.config.port",
        "path": "$.config.fallbackPort"
      }
    ]
  }
}
```

---

## Common Use Cases

### Update Configuration
```json
{
  "tool": "set_value",
  "params": {
    "path": "$.config.features.newFeature",
    "value": true
  }
}
```

### Add Dependencies
```json
{
  "tool": "add_value",
  "params": {
    "path": "$.dependencies",
    "value": "lodash"
  }
}
```

### Increment Statistics
```json
{
  "tool": "transform_value",
  "params": {
    "path": "$.stats.downloads",
    "operation": "increment",
    "value": 1
  }
}
```

### Reorganize Data
```json
{
  "tool": "batch_operations",
  "params": {
    "operations": [
      {
        "op": "move",
        "from": "$.oldLocation",
        "path": "$.newLocation"
      },
      {
        "op": "set",
        "path": "$.migrated",
        "value": true
      }
    ]
  }
}
```

### Validate and Update
```json
// First test
{
  "tool": "test_value",
  "params": {
    "path": "$.version",
    "condition": "exists"
  }
}

// Then update if exists
{
  "tool": "set_value",
  "params": {
    "path": "$.version",
    "value": "3.0.0"
  }
}
```

---

## Best Practices

1. **Always use valid JSONPaths** - Start with `$` or `$.` for clarity
2. **Test before destructive operations** - Use `test_value` to verify paths exist
3. **Use batch operations** - When making multiple changes, use `batch_operations` for atomicity
4. **Handle arrays carefully** - Remember array indices start at 0
5. **Validate JSON** - Ensure the document is valid JSON before operations

---

## Error Handling

All tools return a consistent response format:

**Success:**
```json
{
  "success": true,
  "message": "Operation completed",
  "value": /* result value */
}
```

**Failure:**
```json
{
  "success": false,
  "error": "Error description"
}
```

Common errors:
- `"Invalid JSON"` - Document is malformed
- `"Path does not exist"` - Specified path not found
- `"Value must be an array"` - Operation requires array target
- `"Key is required"` - Missing required parameter
