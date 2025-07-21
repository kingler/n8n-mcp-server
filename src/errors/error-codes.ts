/**
 * Error Codes Module
 *
 * This module defines error codes used throughout the application.
 * These codes are compatible with the MCP SDK error handling system.
 */

export enum ErrorCode {
  // Initialization and Configuration Errors (1000-1099)
  InitializationError = 1000,
  ConfigurationError = 1001,
  EnvironmentError = 1002,
  
  // Authentication and Authorization Errors (1100-1199)
  AuthenticationError = 1100,
  AuthorizationError = 1101,
  InvalidCredentials = 1102,
  TokenExpired = 1103,
  
  // API and Network Errors (1200-1299)
  ApiConnectionError = 1200,
  ApiTimeoutError = 1201,
  ApiRateLimitError = 1202,
  InvalidApiResponse = 1203,
  
  // Resource Errors (1300-1399)
  NotFoundError = 1300,
  WorkflowNotFound = 1301,
  ExecutionNotFound = 1302,
  CredentialNotFound = 1303,
  TagNotFound = 1304,
  UserNotFound = 1305,
  
  // Validation Errors (1400-1499)
  ValidationError = 1400,
  InvalidRequest = 1401,
  MissingRequiredField = 1402,
  InvalidFieldValue = 1403,
  InvalidWorkflowData = 1404,
  InvalidExecutionData = 1405,
  InvalidCredentialData = 1406,
  
  // Workflow Errors (1500-1599)
  WorkflowError = 1500,
  WorkflowActivationError = 1501,
  WorkflowDeactivationError = 1502,
  WorkflowExecutionError = 1503,
  WorkflowValidationError = 1504,
  WorkflowTransferError = 1505,
  WorkflowCreationError = 1506,
  WorkflowUpdateError = 1507,
  WorkflowDeletionError = 1508,
  WorkflowOperationError = 1509,
  
  // Execution Errors (1600-1699)
  ExecutionError = 1600,
  ExecutionStartError = 1601,
  ExecutionStopError = 1602,
  ExecutionRetryError = 1603,
  ExecutionTimeoutError = 1604,
  ExecutionOperationError = 1605,
  
  // Credential Errors (1700-1799)
  CredentialError = 1700,
  CredentialCreationError = 1701,
  CredentialUpdateError = 1702,
  CredentialDeletionError = 1703,
  CredentialTestError = 1704,
  CredentialTransferError = 1705,
  CredentialOperationError = 1706,
  
  // Tag Errors (1750-1769)
  TagError = 1750,
  TagCreationError = 1751,
  TagUpdateError = 1752,
  TagDeletionError = 1753,
  TagOperationError = 1754,
  
  // User Errors (1770-1789)
  UserError = 1770,
  UserOperationError = 1771,
  
  // Variable Errors (1790-1799)
  VariableError = 1790,
  VariableCreationError = 1791,
  VariableUpdateError = 1792,
  VariableDeletionError = 1793,
  VariableOperationError = 1794,
  
  // File Upload Errors (1800-1899)
  UploadError = 1800,
  FileTooLarge = 1801,
  InvalidFileType = 1802,
  UploadFailed = 1803,
  FileNotFoundError = 1804,
  InvalidFileTypeError = 1805,
  
  // Internal Errors (1900-1999)
  InternalError = 1900,
  DatabaseError = 1901,
  ServiceUnavailable = 1902,
  NotImplemented = 1903,
  
  // MCP Protocol Errors (2000-2099)
  McpProtocolError = 2000,
  InvalidToolCall = 2001,
  ToolExecutionError = 2002,
  ToolNotFound = 2003,
  ResourceNotFound = 2004,
}

/**
 * Error code descriptions for better error messages
 */
export const ErrorCodeDescriptions: Record<ErrorCode, string> = {
  [ErrorCode.InitializationError]: 'Failed to initialize the MCP server',
  [ErrorCode.ConfigurationError]: 'Invalid configuration provided',
  [ErrorCode.EnvironmentError]: 'Missing or invalid environment variables',
  [ErrorCode.AuthenticationError]: 'Authentication failed',
  [ErrorCode.AuthorizationError]: 'Insufficient permissions',
  [ErrorCode.InvalidCredentials]: 'Invalid credentials provided',
  [ErrorCode.TokenExpired]: 'Authentication token has expired',
  [ErrorCode.ApiConnectionError]: 'Failed to connect to n8n API',
  [ErrorCode.ApiTimeoutError]: 'n8n API request timed out',
  [ErrorCode.ApiRateLimitError]: 'n8n API rate limit exceeded',
  [ErrorCode.InvalidApiResponse]: 'Invalid response from n8n API',
  [ErrorCode.NotFoundError]: 'Resource not found',
  [ErrorCode.WorkflowNotFound]: 'Workflow not found',
  [ErrorCode.ExecutionNotFound]: 'Execution not found',
  [ErrorCode.CredentialNotFound]: 'Credential not found',
  [ErrorCode.TagNotFound]: 'Tag not found',
  [ErrorCode.UserNotFound]: 'User not found',
  [ErrorCode.ValidationError]: 'Validation failed',
  [ErrorCode.InvalidRequest]: 'Invalid request parameters',
  [ErrorCode.MissingRequiredField]: 'Required field is missing',
  [ErrorCode.InvalidFieldValue]: 'Invalid field value provided',
  [ErrorCode.InvalidWorkflowData]: 'Invalid workflow data provided',
  [ErrorCode.InvalidExecutionData]: 'Invalid execution data provided',
  [ErrorCode.InvalidCredentialData]: 'Invalid credential data provided',
  [ErrorCode.WorkflowError]: 'Workflow operation failed',
  [ErrorCode.WorkflowActivationError]: 'Failed to activate workflow',
  [ErrorCode.WorkflowDeactivationError]: 'Failed to deactivate workflow',
  [ErrorCode.WorkflowExecutionError]: 'Workflow execution failed',
  [ErrorCode.WorkflowValidationError]: 'Workflow validation failed',
  [ErrorCode.WorkflowTransferError]: 'Failed to transfer workflow ownership',
  [ErrorCode.WorkflowCreationError]: 'Failed to create workflow',
  [ErrorCode.WorkflowUpdateError]: 'Failed to update workflow',
  [ErrorCode.WorkflowDeletionError]: 'Failed to delete workflow',
  [ErrorCode.WorkflowOperationError]: 'Workflow operation failed',
  [ErrorCode.ExecutionError]: 'Execution operation failed',
  [ErrorCode.ExecutionStartError]: 'Failed to start execution',
  [ErrorCode.ExecutionStopError]: 'Failed to stop execution',
  [ErrorCode.ExecutionRetryError]: 'Failed to retry execution',
  [ErrorCode.ExecutionTimeoutError]: 'Execution timed out',
  [ErrorCode.ExecutionOperationError]: 'Execution operation failed',
  [ErrorCode.CredentialError]: 'Credential operation failed',
  [ErrorCode.CredentialCreationError]: 'Failed to create credential',
  [ErrorCode.CredentialUpdateError]: 'Failed to update credential',
  [ErrorCode.CredentialDeletionError]: 'Failed to delete credential',
  [ErrorCode.CredentialTestError]: 'Failed to test credential',
  [ErrorCode.CredentialTransferError]: 'Failed to transfer credential ownership',
  [ErrorCode.UploadError]: 'File upload failed',
  [ErrorCode.FileTooLarge]: 'File size exceeds maximum limit',
  [ErrorCode.InvalidFileType]: 'Invalid file type provided',
  [ErrorCode.UploadFailed]: 'File upload operation failed',
  [ErrorCode.FileNotFoundError]: 'File not found',
  [ErrorCode.InvalidFileTypeError]: 'Invalid file type error',
  [ErrorCode.InternalError]: 'Internal server error',
  [ErrorCode.DatabaseError]: 'Database operation failed',
  [ErrorCode.ServiceUnavailable]: 'Service is temporarily unavailable',
  [ErrorCode.NotImplemented]: 'Feature not implemented',
  [ErrorCode.McpProtocolError]: 'MCP protocol error',
  [ErrorCode.InvalidToolCall]: 'Invalid tool call',
  [ErrorCode.ToolExecutionError]: 'Tool execution failed',
  [ErrorCode.ToolNotFound]: 'Tool handler not found',
  [ErrorCode.ResourceNotFound]: 'MCP resource not found',
  [ErrorCode.CredentialOperationError]: 'Credential operation failed',
  [ErrorCode.TagError]: 'Tag operation failed',
  [ErrorCode.TagCreationError]: 'Failed to create tag',
  [ErrorCode.TagUpdateError]: 'Failed to update tag',
  [ErrorCode.TagDeletionError]: 'Failed to delete tag',
  [ErrorCode.TagOperationError]: 'Tag operation failed',
  [ErrorCode.UserError]: 'User operation failed',
  [ErrorCode.UserOperationError]: 'Failed to perform user operation',
  [ErrorCode.VariableError]: 'Variable operation failed',
  [ErrorCode.VariableCreationError]: 'Failed to create variable',
  [ErrorCode.VariableUpdateError]: 'Failed to update variable',
  [ErrorCode.VariableDeletionError]: 'Failed to delete variable',
  [ErrorCode.VariableOperationError]: 'Failed to perform variable operation',
}; 