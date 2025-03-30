export class ErrorModel {
  // File errors
  static readonly BIG_SIZE_FILE = {
    error_code: "BIG_SIZE_FILE",
    message:
      "File size exceeds the limit of 5MB. Please upload a smaller file.",
  };
  static readonly NOT_SUPPORTED_FILE = {
    error_code: "NOT_SUPPORTED_FILE",
    message:
      "File type not supported. Please upload a .jpg, .jpeg, or .png file.",
  };
  static readonly REQUIRE_QUERY_PARAM = {
    error_code: "REQUIRE_QUERY_PARAM",
    message: "The query parameter is required. Query parameter:",
  };
  static readonly NOT_SUPPORTED_TYPE_DIRECTORY = {
    error_code: "NOT_SUPPORTED_TYPE",
    message:
      "Type directory not supported. Please use the type directory: 'category' or 'product'.",
  };
  static readonly FILE_NOT_FOUND = {
    error_code: "FILE_NOT_FOUND",
    message: "File not found.",
  };
  // Category errors
  static readonly CATEGORY_ALREADY_EXISTS = {
    error_code: "CATEGORY_ALREADY_EXISTS",
    message: "Category already exists.",
  };
  static readonly CATEGORY_DOES_NOT_EXIST = {
    error_code: "CATEGORY_NOT_FOUND",
    message: "Category not found",
  };
  // Product errors
  static readonly PRODUCT_DOES_NOT_EXIST = {
    error_code: "PRODUCT_NOT_FOUND",
    message: "Product not found.",
  };
  static readonly PRODUCT_ALIAS_ALREADY_EXISTS = {
    error_code: "PRODUCT_ALIAS_ALREADY_EXISTS",
    message: "Product alias already exists.",
  };
  static readonly PRODUCT_CREATE_FAILED = {
    error_code: "PRODUCT_CREATE_FAILED",
    message: "Failed to create product.",
  };
  static readonly PRODUCT_CREATE_INCORRECT_BODY = (value: string) => ({
    error_code: "PRODUCT_CREATE_INCORRECT_BODY",
    message: `Incorrect body for creating a product. Please check the body: ${value}`,
  });
  static readonly PRODUCT_CREATE_FAILED_WITH_PROBLEM_CRM = {
    error_code: "PRODUCT_CREATE_FAILED_WITH_PROBLEM_CRM",
    message: "Failed to create a product in CRM.",
  };
  // User errors
  static readonly USER_ALREADY_EXISTS = {
    error_code: "USER_ALREADY_EXISTS",
    message: "User already exists.",
  };
  static readonly USER_PASSWORD_NOT_MATCH = {
    error_code: "USER_PASSWORD_NOT_MATCH",
    message: "Password does not match.",
  };
  static readonly USER_INVALID_CREDENTIALS = {
    error_code: "USER_INVALID_CREDENTIALS",
    message: "Invalid credentials.",
  };
  static readonly USER_DOES_NOT_EXIST = {
    error_code: "USER_NOT_FOUND",
    message: "User does not exist.",
  };
  // Validation errors
  static readonly VALIDATION_FAILED = {
    error_code: "VALIDATION_FAILED",
    message: "Validation failed.",
  };
  // Token errors
  static readonly REFRESH_TOKEN_EXPIRED = {
    error_code: "REFRESH_TOKEN_EXPIRED",
    message: "Refresh token expired.",
  };
  // Session errors
  static readonly SESSION_NOT_FOUND = {
    error_code: "SESSION_NOT_FOUND",
    message: "Session not found.",
  };
  static readonly SESSION_ID_NOT_FOUND = {
    error_code: "SESSION_ID_NOT_FOUND",
    message: "Session id not found.",
  };
  // Internal server errors
  static readonly INTERNAL_SERVER_ERROR = {
    error_code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error.",
  };
  // Order errors
  static readonly ORDER_ALREADY_CONFIRMED = {
    error_code: "ORDER_ALREADY_CONFIRMED",
    message: "Order is already confirmed.",
  };
}
