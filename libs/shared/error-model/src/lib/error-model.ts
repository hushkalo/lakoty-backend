import { ApiProperty } from "@nestjs/swagger";

export class ErrorModel {
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
  static CATEGORY_NOT_FOUND(searchValues: string) {
    return {
      error_code: "CATEGORY_NOT_FOUND",
      message: `Category with ID ${searchValues} not found`,
    };
  }
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

// base error interface
export interface AppError {
  error_code: string;
  message: string;
}

// General errors
export class BigSizeFileError implements AppError {
  @ApiProperty({
    type: String,
    example: "BIG_SIZE_FILE",
    description: "Error code for file size limit exceeded",
  })
  readonly error_code = "BIG_SIZE_FILE";
  @ApiProperty({
    type: String,
    example:
      "File size exceeds the limit of 5MB. Please upload a smaller file.",
    description: "Error message for file size limit exceeded",
  })
  readonly message =
    "File size exceeds the limit of 5MB. Please upload a smaller file.";
}

export class NotSupportedFileError implements AppError {
  @ApiProperty({
    type: String,
    example: "NOT_SUPPORTED_FILE",
    description: "Error code for unsupported file type",
  })
  readonly error_code = "NOT_SUPPORTED_FILE";
  @ApiProperty({
    type: String,
    example:
      "File type not supported. Please upload a .jpg, .jpeg, or .png file.",
    description: "Error message for unsupported file type",
  })
  readonly message =
    "File type not supported. Please upload a .jpg, .jpeg, or .png file.";
}

export class RequireQueryParamError implements AppError {
  @ApiProperty({
    type: String,
    example: "REQUIRE_QUERY_PARAM",
    description: "Error code for missing required query parameter",
  })
  readonly error_code = "REQUIRE_QUERY_PARAM";
  @ApiProperty({
    type: String,
    example: "The query parameter is required. Query parameter:",
    description: "Error message for missing required query parameter",
  })
  readonly message = "The query parameter is required. Query parameter:";
}

export class NotSupportedTypeDirectoryError implements AppError {
  @ApiProperty({
    type: String,
    example: "NOT_SUPPORTED_TYPE",
    description: "Error code for unsupported directory type",
  })
  readonly error_code = "NOT_SUPPORTED_TYPE";
  @ApiProperty({
    type: String,
    example:
      "Type directory not supported. Please use the type directory: 'category' or 'product'.",
    description: "Error message for unsupported directory type",
  })
  readonly message =
    "Type directory not supported. Please use the type directory: 'category' or 'product'.";
}

export class FileNotFoundError implements AppError {
  @ApiProperty({
    type: String,
    example: "FILE_NOT_FOUND",
    description: "Error code for file not found",
  })
  readonly error_code = "FILE_NOT_FOUND";
  @ApiProperty({
    type: String,
    example: "File not found.",
    description: "Error message for file not found",
  })
  readonly message = "File not found.";
}

// Category errors
export class CategoryAlreadyExistsError implements AppError {
  @ApiProperty({
    type: String,
    example: "CATEGORY_ALREADY_EXISTS",
    description: "Error code for duplicate category",
  })
  readonly error_code = "CATEGORY_ALREADY_EXISTS";
  @ApiProperty({
    type: String,
    example: "Category already exists.",
    description: "Error message for duplicate category",
  })
  readonly message = "Category already exists.";
}

export class CategoryDoesNotExistError implements AppError {
  @ApiProperty({
    type: String,
    example: "CATEGORY_NOT_FOUND",
    description: "Error code for non-existent category",
  })
  readonly error_code = "CATEGORY_NOT_FOUND";
  @ApiProperty({
    type: String,
    example: "Category not found",
    description: "Error message for non-existent category",
  })
  readonly message = "Category not found";
}

export class CategoryNotFoundError implements AppError {
  @ApiProperty({
    type: String,
    example: "CATEGORY_NOT_FOUND",
    description: "Error code for category not found",
  })
  readonly error_code = "CATEGORY_NOT_FOUND";
  @ApiProperty({
    type: String,
    example: "Category with ID cm7z5tnsw00it9lsvax78ti7c not found",
    description: "Error message for category not found",
  })
  readonly message: string;

  constructor(id: string) {
    this.message = `Category with ID ${id} not found`;
  }
}

export class CategoryNotFoundByAliasError implements AppError {
  @ApiProperty({
    type: String,
    example: "CATEGORY_NOT_FOUND",
    description: "Error code for category not found",
  })
  readonly error_code = "CATEGORY_NOT_FOUND";
  @ApiProperty({
    type: String,
    example: "Category with alias electronic not found",
    description: "Error message for category not found",
  })
  readonly message: string;

  constructor(alias: string) {
    this.message = `Category with alias ${alias} not found`;
  }
}

// Product errors
export class ProductDoesNotExistError implements AppError {
  @ApiProperty({
    type: String,
    example: "PRODUCT_NOT_FOUND",
    description: "Error code for non-existent product",
  })
  readonly error_code = "PRODUCT_NOT_FOUND";
  @ApiProperty({
    type: String,
    example: "Product not found.",
    description: "Product with ID cm7z5tnsw00it9lsvax78ti7c not found",
  })
  readonly message: string;

  constructor(id: string) {
    this.message = `Product with ID ${id} not found`;
  }
}

export class ProductDoesNotExistByAliasError implements AppError {
  @ApiProperty({
    type: String,
    example: "PRODUCT_NOT_FOUND",
    description: "Error code for non-existent product by alias",
  })
  readonly error_code = "PRODUCT_NOT_FOUND";
  @ApiProperty({
    type: String,
    example: "Product with alias telephonne-15-pro-max not found",
    description: "Error message for non-existent product by alias",
  })
  readonly message: string;

  constructor(alias: string) {
    this.message = `Product with alias ${alias} not found`;
  }
}

export class ProductSizeDoesNotExistError implements AppError {
  @ApiProperty({
    type: String,
    example: "PRODUCT_SIZE_NOT_FOUND",
    description: "Error code for non-existent product's size",
  })
  readonly error_code = "PRODUCT_SIZE_NOT_FOUND";
  @ApiProperty({
    type: String,
    example: "Product size with ID cm7z5tnsw00it9lsvax78ti7c not found",
    description: "Error message for non-existent product's size",
  })
  readonly message: string;

  constructor(id: string) {
    this.message = `Product size with ID ${id} not found`;
  }
}

export class ProductAliasAlreadyExistsError implements AppError {
  @ApiProperty({
    type: String,
    example: "PRODUCT_ALIAS_ALREADY_EXISTS",
    description: "Error code for duplicate product alias",
  })
  readonly error_code = "PRODUCT_ALIAS_ALREADY_EXISTS";
  @ApiProperty({
    type: String,
    example: "Product alias already exists.",
    description: "Error message for duplicate product alias",
  })
  readonly message = "Product alias already exists.";
}

export class ProductCreateFailedError implements AppError {
  @ApiProperty({
    type: String,
    example: "PRODUCT_CREATE_FAILED",
    description: "Error code for failed product creation",
  })
  readonly error_code = "PRODUCT_CREATE_FAILED";
  @ApiProperty({
    type: String,
    example: "Failed to create product.",
    description: "Error message for failed product creation",
  })
  readonly message = "Failed to create product.";
}

export class ProductCreateIncorrectBodyError implements AppError {
  @ApiProperty({
    type: String,
    example: "PRODUCT_CREATE_INCORRECT_BODY",
    description: "Error code for invalid product creation body",
  })
  readonly error_code = "PRODUCT_CREATE_INCORRECT_BODY";
  @ApiProperty({
    type: String,
    example:
      "Incorrect body for creating a product. Please check the body: {...}",
    description: "Error message for invalid product creation body",
  })
  readonly message: string;

  constructor(body: string) {
    this.message = `Incorrect body for creating a product. Please check the body: ${body}`;
  }
}

export class ProductCreateFailedWithCrmError implements AppError {
  @ApiProperty({
    type: String,
    example: "PRODUCT_CREATE_FAILED_WITH_PROBLEM_CRM",
    description: "Error code for CRM product creation failure",
  })
  readonly error_code = "PRODUCT_CREATE_FAILED_WITH_PROBLEM_CRM";
  @ApiProperty({
    type: String,
    example: "Failed to create a product in CRM.",
    description: "Error message for CRM product creation failure",
  })
  readonly message = "Failed to create a product in CRM.";
}

// User errors
export class UserAlreadyExistsError implements AppError {
  @ApiProperty({
    type: String,
    example: "USER_ALREADY_EXISTS",
    description: "Error code for duplicate user",
  })
  readonly error_code = "USER_ALREADY_EXISTS";
  @ApiProperty({
    type: String,
    example: "User already exists.",
    description: "Error message for duplicate user",
  })
  readonly message = "User already exists.";
}

export class UserPasswordNotMatchError implements AppError {
  @ApiProperty({
    type: String,
    example: "USER_PASSWORD_NOT_MATCH",
    description: "Error code for password mismatch",
  })
  readonly error_code = "USER_PASSWORD_NOT_MATCH";
  @ApiProperty({
    type: String,
    example: "Password does not match.",
    description: "Error message for password mismatch",
  })
  readonly message = "Password does not match.";
}

export class UserInvalidCredentialsError implements AppError {
  @ApiProperty({
    type: String,
    example: "USER_INVALID_CREDENTIALS",
    description: "Error code for invalid credentials",
  })
  readonly error_code = "USER_INVALID_CREDENTIALS";
  @ApiProperty({
    type: String,
    example: "Invalid credentials.",
    description: "Error message for invalid credentials",
  })
  readonly message = "Invalid credentials.";
}

export class UserDoesNotExistError implements AppError {
  @ApiProperty({
    type: String,
    example: "USER_NOT_FOUND",
    description: "Error code for non-existent user",
  })
  readonly error_code = "USER_NOT_FOUND";
  @ApiProperty({
    type: String,
    example: "User does not exist.",
    description: "Error message for non-existent user",
  })
  readonly message = "User does not exist.";
}

// Validation errors
export class ValidationFailedError implements AppError {
  @ApiProperty({
    type: String,
    example: "VALIDATION_FAILED",
    description: "Error code for validation failure",
  })
  readonly error_code = "VALIDATION_FAILED";
  @ApiProperty({
    type: String,
    example: "Validation failed.",
    description: "Error message for validation failure",
  })
  readonly message = "Validation failed.";
}

// Token errors
export class RefreshTokenExpiredError implements AppError {
  @ApiProperty({
    type: String,
    example: "REFRESH_TOKEN_EXPIRED",
    description: "Error code for expired refresh token",
  })
  readonly error_code = "REFRESH_TOKEN_EXPIRED";
  @ApiProperty({
    type: String,
    example: "Refresh token expired.",
    description: "Error message for expired refresh token",
  })
  readonly message = "Refresh token expired.";
}

// Session errors
export class SessionNotFoundError implements AppError {
  @ApiProperty({
    type: String,
    example: "SESSION_NOT_FOUND",
    description: "Error code for session not found",
  })
  readonly error_code = "SESSION_NOT_FOUND";
  @ApiProperty({
    type: String,
    example: "Session not found.",
    description: "Error message for session not found",
  })
  readonly message = "Session not found.";
}

export class SessionIdNotFoundError implements AppError {
  @ApiProperty({
    type: String,
    example: "SESSION_ID_NOT_FOUND",
    description: "Error code for session ID not found",
  })
  readonly error_code = "SESSION_ID_NOT_FOUND";
  @ApiProperty({
    type: String,
    example: "Session id not found.",
    description: "Error message for session ID not found",
  })
  readonly message = "Session id not found.";
}

// Internal server error
export class InternalServerError implements AppError {
  @ApiProperty({
    type: String,
    example: "INTERNAL_SERVER_ERROR",
    description: "Error code for internal server error",
  })
  readonly error_code = "INTERNAL_SERVER_ERROR";
  @ApiProperty({
    type: String,
    example: "Internal server error.",
    description: "Error message for internal server error",
  })
  readonly message = "Internal server error.";
}

// Order errors
export class OrderAlreadyConfirmedError implements AppError {
  @ApiProperty({
    type: String,
    example: "ORDER_ALREADY_CONFIRMED",
    description: "Error code for already confirmed order",
  })
  readonly error_code = "ORDER_ALREADY_CONFIRMED";
  @ApiProperty({
    type: String,
    example: "Order is already confirmed.",
    description: "Error message for already confirmed order",
  })
  readonly message = "Order is already confirmed.";
}
