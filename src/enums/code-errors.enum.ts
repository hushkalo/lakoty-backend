export enum ECodeErrors {
  // File errors
  BIG_SIZE_FILE_CODE = "BIG_SIZE_FILE",
  BIG_SIZE_FILE_MESSAGE = "File size exceeds the limit of 1MB. Please upload a smaller file.",
  NOT_SUPPORTED_FILE_CODE = "NOT_SUPPORTED_FILE",
  NOT_SUPPORTED_FILE_MESSAGE = "File type not supported. Please upload a .jpg, .jpeg, or .png file.",
  REQUIRE_QUERY_PARAM_CODE = "REQUIRE_QUERY_PARAM",
  REQUIRE_QUERY_PARAM_MESSAGE = "The query parameter is required. Query parameter:",
  NOT_SUPPORTED_TYPE_DIRECTORY_CODE = "NOT_SUPPORTED_TYPE",
  NOT_SUPPORTED_TYPE_DIRECTORY_MESSAGE = "Type directory not supported. Please use the type directory: 'category' or 'product'.",
  FILE_NOT_FOUND_CODE = "FILE_NOT_FOUND",
  FILE_NOT_FOUND_MESSAGE = "File not found.",
  // User errors
  USER_ALREADY_EXISTS_CODE = "USER_ALREADY_EXISTS",
  USER_ALREADY_EXISTS_MESSAGE = "User already exists.",
  USER_PASSWORD_NOT_MATCH_CODE = "USER_PASSWORD_NOT_MATCH",
  USER_PASSWORD_NOT_MATCH_MESSAGE = "Password does not match.",
  USER_INVALID_CREDENTIALS_CODE = "USER_INVALID_CREDENTIALS",
  USER_INVALID_CREDENTIALS_MESSAGE = "Invalid credentials.",
  USER_DOES_NOT_EXIST_CODE = "USER_DOES_NOT_EXIST",
  USER_DOES_NOT_EXIST_MESSAGE = "User does not exist.",
  // Validation errors
  VALIDATION_FAILED_CODE = "VALIDATION_FAILED",
  VALIDATION_FAILED_MESSAGE = "Validation failed.",
  // Token errors
  REFRESH_TOKEN_EXPIRED_MESSAGE = "Refresh token expired.",
  REFRESH_TOKEN_EXPIRED_CODE = "REFRESH_TOKEN_EXPIRED",
  // Session errors
  SESSION_NOT_FOUND_MESSAGE = "Session not found.",
  SESSION_NOT_FOUND_CODE = "SESSION_NOT_FOUND",
  SESSION_ID_NOT_FOUND_MESSAGE = "Session id not found.",
  SESSION_ID_NOT_FOUND_CODE = "SESSION_ID_NOT_FOUND",
  // internal server errors
  INTERNAL_SERVER_ERROR_CODE = "INTERNAL_SERVER_ERROR",
  INTERNAL_SERVER_ERROR_MESSAGE = "Internal server error.",
}
