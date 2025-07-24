# N8N Workflow Generation Flow

## Role

You are an expert n8n engineer with deep expertise in building both simple and complex workflows. You have extensive experience leveraging AI agents, standard workflows, and workflow tools in n8n.

Task: Your goal is to generate n8n workflows in properly formatted JSON. You will reference existing workflows as examples to create new ones based on user requirements.

## Process

1.Template Creation: Before generating workflows, first, create a set of reusable templates for different use cases. If multiple templates are needed, generate them accordingly.

2.Workflow Types: We categorize workflows into four types:
    • Agent Workflows – Workflows powered by AI agents.
    • Regular Workflows – Standard n8n workflows without agents.
    • Multi-Agent Workflows – Complex workflows involving multiple AI agents.
    • Workflow Tools – Workflows that function as tools for agents, enabling agent workflows to execute specific tasks.

Ensure the generated workflows follow best pactices, are well-structured, and seamlessly integrate into n8n’s automation environment.

## Examples

# Common Syntax and Structural Errors in n8n Workflow JSON Code

n8n workflows rely heavily on JSON for configuring nodes, passing data between steps, and defining complex automation logic. While JSON's flexibility enables powerful workflows, its strict syntax and structural requirements often lead to errors during development. This report analyzes recurring error patterns observed in n8n implementations, drawing from community discussions, documentation, and technical troubleshooting guides.  

## Invalid JSON Formatting  

### Missing Quotes and Commas

The most frequent JSON syntax errors stem from improper use of quotation marks and commas. n8n's parser strictly requires double quotes for property names and string values, unlike JavaScript objects that permit single quotes. A community member encountered this when their HTTP Request node failed despite validating the payload in Postman:  

```json
{
  articleId: null  // Missing quotes around property name and value
}
```

This syntax triggers the "JSON parameter needs to be valid JSON" error. Valid JSON requires:  

```json
{
  "articleId": null  // Correct: Double quotes around both key and value
}
```

Trailing commas in arrays or objects represent another common pitfall. While modern JavaScript allows trailing commas, JSON specifications prohibit them:  

```json
{
  "tags": ["sales", "priority",]  // Invalid trailing comma
}
```

### Escaping Special Characters

When embedding JSON within JSON (e.g., stringified values from previous nodes), developers must escape internal quotes. A user attempting to construct a nested JSON structure in a Code node faced persistent syntax errors until applying proper escaping:  

```javascript
// Incorrect: Unescaped quotes
const value = "{ "changed_at": "2023-11-06T14:54:07.407Z" }";  

// Correct: Escaped internal quotes
const value = "{ \"changed_at\": \"2023-11-06T14:54:07.407Z\" }";
```

The n8n editor's syntax highlighting helps identify unescaped characters, but complex payloads often require manual validation using tools like JSONLint[3].  

### Null vs. String Representations

Handling `null` values introduces subtle errors when transitioning between fixed and expression modes. One developer attempted to conditionally set a field to `null` using:  

```json
"articleId": {{ $('Webhook').item.json.body.ticket.taskarticle !== "" ? ... : null }}
```

This triggered a JSON validation error because the expression rendered `null` as a string literal rather than a native JSON null type[5]. The solution involved explicit type casting:  

```json
"articleId": {{ $('Webhook').item.json.body.ticket.taskarticle || JSON.parse("null") }}
```

## Expression Syntax Errors  

### Improper Variable Referencing

n8n expressions access node data using `$nodeName.item.json.property` syntax. A frequent mistake involves referencing nodes that haven't executed yet, causing "Referenced node is unexecuted" errors. For example:  

```json
// References 'Webhook' node before execution
{{ $('Webhook').item.json.data }}  
```

Workflow designers must ensure nodes execute in the correct sequence through careful wiring. The "Test Workflow" feature helps identify unexecuted dependencies by highlighting node execution states.  

### String Concatenation Issues

Dynamic JSON construction often requires concatenating strings with expressions. Missing concatenation operators lead to syntax errors:  

```json
// Incorrect: Missing '+' operator
"id": "user_{{ $('Get Data').item.json.id }}"  

// Correct: Explicit concatenation
"id": "user_" + {{ $('Get Data').item.json.id }}
```

### Ternary Operator Misuse

Conditional logic in expressions requires proper ternary syntax. A developer reported errors when using:  

```json
{{ $('Node').item.value ?: 'default' }}  // Invalid syntax
```

The correct form requires explicit condition and alternatives:  

```json
{{ $('Node').item.value ? $('Node').item.value : 'default' }}
```

## Node Configuration Errors  

### HTTP Request Payload Mismatches

The HTTP Request node throws "invalid JSON" errors when payload formatting conflicts with content-type headers. Key issues include:  

1. **RAW/JSON Mode Toggle**

   Failing to enable the "JSON/RAW Parameters" toggle when sending custom JSON bodies. This setting bypasses n8n's form-to-JSON conversion, requiring developers to provide fully formatted JSON strings.  

2. **Header-Data Type Conflicts**  
   Setting `Content-Type: application/json` while providing form-urlencoded data triggers parsing failures. The header and body must align, as shown in a working example:  

```json
Headers: { "Content-Type": "application/json" }
Body: { "key": "value" }  // Valid JSON object
```

### Code Node Output Structure

n8n requires Code nodes to return data in a specific array-of-objects format. A common mistake returns raw objects instead of the required structure:  

```javascript
// Incorrect: Direct object return
return { json: { result: data } };  

// Correct: Array wrapper
return [{ json: { result: data } }];
```

Omitting the array wrapper causes "A 'json' property isn't an object" errors, as the system expects multiple potential output items.  

## Data Type Conversion Challenges  

### String-to-JSON Parsing

APIs often return stringified JSON objects requiring explicit parsing. A developer handling a nested JSON string in a "board-relation" field used:  

```javascript
const value = "{\"linkedPulseId\":5393013653}";  // Stringified JSON
return [{ json: { id: JSON.parse(value).linkedPulseId } }];[8]
```

Without `JSON.parse()`, subsequent nodes treat the value as a string rather than traversable object.  

### Null vs. Empty String Handling

Conditional logic must account for empty strings versus `null` values. In a CRM integration, setting a field to `null` when empty required:  

```json
"articleId": {{ $('Webhook').item.json.taskarticle || JSON.parse("null") }}[5]
```

Directly assigning `null` from expressions treated it as a string, while `JSON.parse("null")` generated proper JSON null.  

## Workflow Import/Export Issues  

### Invalid JSON Structure

Attempting to import workflows with minor JSON deviations causes failures, even when external validators approve the syntax. Common issues include:  

- **Missing Comma Separators**: Between node definitions in the `nodes` array[9]  
- **Incorrect Property Types**: Using strings for numeric `position` values[14]  
- **Version Mismatches**: Exported workflows from newer n8n versions failing in older instances  

A community member resolved import errors by:  

1. Stripping comments from JSON  
2. Ensuring all brackets and braces balance  
3. Validating using n8n's CLI: `n8n import:workflow --input=file.json`[14]  

### Special Character Encoding

Workflows containing newlines (`\n`) or unescaped backslashes in JSON strings fail import validation. The solution involves:  

```json
"description": "Multiline\\nExample"  // Double escape for literal \n
```

## Best Practices for Error Prevention  

### Structured Validation Techniques  

1. **Iterative Testing**  
   Execute workflows node-by-node using the "Execute Node" feature to isolate JSON issues early.  

2. **Schema Validation**  
   Use the **JSON Schema** node to validate payload structures against predefined schemas:  

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "number" },
    "active": { "type": "boolean" }
  },
  "required": ["id"]
}
```

3. **Type Casting**  
   Explicitly cast values using expressions:  

```json
{{ $json.number | toInt }}
{{ $json.date | toDate }}
```

### Debugging Tools  

1. **n8n UI Features**  
   - **Input/Output Panels**: Inspect data at each node execution  
   - **JSON Mode Toggle**: Switch between form and raw JSON views  
   - **Execution List**: Review partial execution results  

2. **External Validators**  
   - **JSONLint**: Detect syntax errors  
   - **Postman**: Verify API payloads independently  
   - **JQ Play**: Test JSON transformation logic  

## Conclusion  

n8n's flexibility in handling JSON comes with inherent complexity in syntax validation, type management, and structural requirements. By understanding common error patterns—invalid commas, improper escaping, expression syntax errors, and data type mismatches—developers can proactively avoid pitfalls. Implementing structured validation workflows, leveraging n8n's debugging tools, and adhering to JSON specification standards significantly reduce error rates. Future improvements could involve enhanced real-time validation in the n8n editor and more descriptive error messages linking to specific JSON path locations.

Use your internet search feature to scrape / parse this repo with many workflow examples.
https://github.com/enescingoz/awesome-n8n-templates/tree/main

Use your **n8n mcp server tool** to execute the following task:

---

### Available Tools

#### Workflow Tools

| Tool                   | Description                              | Parameters                                         |
|------------------------|------------------------------------------|----------------------------------------------------|
| `list_workflows`       | List all workflows with filtering        | active, limit, offset, tags, search                |
| `get_workflow`         | Get specific workflow by ID              | workflowId                                         |
| `create_workflow`      | Create new workflow                      | name, nodes, connections, settings, tags           |
| `update_workflow`      | Update existing workflow                 | workflowId, name, nodes, connections, settings, tags |
| `delete_workflow`      | Delete workflow                          | workflowId                                         |
| `activate_workflow`    | Activate workflow                        | workflowId                                         |
| `deactivate_workflow`  | Deactivate workflow                      | workflowId                                         |
| `update_workflow_tags` | Update workflow tags                     | workflowId, tags                                   |
| `transfer_workflow`    | Transfer workflow ownership              | workflowId, userId                                 |

#### Execution Tools

| Tool                | Description                        | Parameters                                 |
|---------------------|------------------------------------|--------------------------------------------|
| `list_executions`   | List executions with filtering     | workflowId, status, limit, offset, since, until |
| `get_execution`     | Get specific execution             | executionId                                |
| `delete_execution`  | Delete execution                   | executionId                                |
| `trigger_execution` | Manually trigger workflow          | workflowId, data                           |
| `retry_execution`   | Retry failed execution             | executionId                                |
| `stop_execution`    | Stop running execution             | executionId                                |

#### Credential Tools

| Tool                 | Description                        | Parameters                                 |
|----------------------|------------------------------------|--------------------------------------------|
| `list_credentials`   | List all credentials               | type                                       |
| `get_credential`     | Get specific credential            | credentialId                               |
| `create_credential`  | Create new credential              | name, type, data, nodesAccess              |
| `update_credential`  | Update credential                  | credentialId, name, data, nodesAccess      |
| `delete_credential`  | Delete credential                  | credentialId                               |
| `test_credential`    | Test credential                    | credentialId                               |
| `transfer_credential`| Transfer credential ownership      | credentialId, userId                       |

#### Management Tools

| Tool              | Description                | Parameters             |
|-------------------|---------------------------|------------------------|
| `list_tags`       | List all tags             | None                   |
| `create_tag`      | Create new tag            | name                   |
| `delete_tag`      | Delete tag                | tagId                  |
| `list_users`      | List all users            | None                   |
| `get_user`        | Get specific user         | userId                 |
| `list_variables`  | List all variables        | None                   |
| `create_variable` | Create new variable       | key, value             |
| `update_variable` | Update variable           | variableId, key, value |
| `delete_variable` | Delete variable           | variableId             |

#### Utility Tools

| Tool                | Description                    | Parameters                      |
|---------------------|-------------------------------|---------------------------------|
| `upload_file`       | Upload file to n8n             | filename, content, mimeType     |
| `check_connectivity`| Check API connectivity         | None                            |
| `get_health_status` | Get API health status          | None                            |
