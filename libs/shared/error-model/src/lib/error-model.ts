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
    message: "Category with this alias already exists.",
  };
  static readonly CATEGORY_DEPTH_MUST_BE_LESS_THEN_PARENT_CATEGORY = {
    error_code: "CATEGORY_DEPTH_MUST_BE_LESS_THEN_PARENT_CATEGORY",
    message:
      "Category depth must be less than or equal to the parent category.",
  };
  static readonly CATEGORY_DOES_NOT_BE_CHILD_OWN_CATEGORY = {
    error_code: "CATEGORY_DOES_NOT_BE_CHILD_OWN_CATEGORY",
    message:
      "Category cannot be a child of its own category. Please check the parent category.",
  };
  static readonly CATEGORY_DOES_NOT_EXIST = {
    error_code: "CATEGORY_NOT_FOUND",
    message: "Category not found",
  };
  static CATEGORY_NOT_FOUND(searchValues: string, type: "ID" | "ALIAS") {
    if (type === "ID") {
      return {
        error_code: "CATEGORY_NOT_FOUND",
        message: `Category with ID ${searchValues} not found`,
      };
    }
    return {
      error_code: "CATEGORY_NOT_FOUND",
      message: `Category with alias ${searchValues} not found`,
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
  static readonly PRODUCT_SIZE_NOT_FOUND = {
    error_code: "PRODUCT_SIZE_NOT_FOUND",
    message: "Product size not found.",
  };
  static readonly PRODUCT_NOT_FOUND_IN_CRM = {
    error_code: "PRODUCT_NOT_FOUND_IN_CRM",
    message: "Product size already exists.",
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
  static readonly USER_UNAUTHORIZED = {
    error_code: "USER_UNAUTHORIZED",
    message: "Unauthorized.",
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
  static readonly SESSION_CREATE_FAILED = {
    error_code: "SESSION_CREATE_FAILED",
    message: "Failed to create session.",
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
  // Upload errors
  static readonly UPLOAD_FAILED = {
    error_code: "UPLOAD_FAILED",
    message: "Failed to upload file.",
  };
  static readonly UPLOAD_FAILED_WITH_PROBLEM_CRM = {
    error_code: "UPLOAD_FAILED_WITH_PROBLEM_CRM",
    message: "Failed to upload file to CRM.",
  };
}

// base error interface
export class AppError {
  @ApiProperty({
    enum: [
      ErrorModel.BIG_SIZE_FILE.error_code,
      ErrorModel.NOT_SUPPORTED_FILE.error_code,
      ErrorModel.REQUIRE_QUERY_PARAM.error_code,
      ErrorModel.NOT_SUPPORTED_TYPE_DIRECTORY.error_code,
      ErrorModel.FILE_NOT_FOUND.error_code,
      ErrorModel.CATEGORY_ALREADY_EXISTS.error_code,
      ErrorModel.CATEGORY_DOES_NOT_EXIST.error_code,
      ErrorModel.CATEGORY_NOT_FOUND("", "ID").error_code,
      ErrorModel.PRODUCT_DOES_NOT_EXIST.error_code,
      ErrorModel.PRODUCT_ALIAS_ALREADY_EXISTS.error_code,
      ErrorModel.PRODUCT_CREATE_FAILED.error_code,
      ErrorModel.PRODUCT_CREATE_INCORRECT_BODY("").error_code,
      ErrorModel.PRODUCT_CREATE_FAILED_WITH_PROBLEM_CRM.error_code,
      ErrorModel.USER_ALREADY_EXISTS.error_code,
      ErrorModel.USER_PASSWORD_NOT_MATCH.error_code,
      ErrorModel.USER_INVALID_CREDENTIALS.error_code,
      ErrorModel.USER_DOES_NOT_EXIST.error_code,
      ErrorModel.VALIDATION_FAILED.error_code,
      ErrorModel.REFRESH_TOKEN_EXPIRED.error_code,
      ErrorModel.SESSION_NOT_FOUND.error_code,
      ErrorModel.SESSION_ID_NOT_FOUND.error_code,
      ErrorModel.INTERNAL_SERVER_ERROR.error_code,
      ErrorModel.ORDER_ALREADY_CONFIRMED.error_code,
    ],
    description: "Error code",
  })
  error_code: string;
  @ApiProperty({
    type: String,
    description: "Error message",
  })
  message: string;
}

class ErrorArrayValidation {
  @ApiProperty({
    type: String,
    description: "The key of the object where the error occurred",
  })
  key: string;
  @ApiProperty({
    type: String,
    description: "Object with reason of error",
  })
  constraints: Record<string, string>;
}

class ErrorArray {
  @ApiProperty({
    type: String,
    description: "The values of the value where the error occurred",
  })
  index: string;
  @ApiProperty({
    type: String,
    description: "The values of the value where the error occurred",
  })
  values: ErrorArrayValidation[];
}
export class AppErrorValidationWithArray extends AppError {
  @ApiProperty({
    type: Array,
    description: "Validation errors",
  })
  errorsReason: ErrorArray[];
}

export class AppErrorValidation extends AppError {
  @ApiProperty({
    type: Array,
    description: "Validation errors",
  })
  errorsReason: Array<{
    key: string;
    constraints: Record<string, string>;
  }>;
}
