// Define a custom error class called ApiError that extends the built-in JavaScript Error class.
// This allows us to create more structured and consistent error objects in our API.
class ApiError extends Error {
    // The constructor takes in:
    // - statusCode: HTTP status code (e.g., 400, 404, 500)
    // - message: optional custom error message (default: "Something went wrong.")
    // - errors: optional array of specific error details (e.g., validation errors)
    // - stack: optional custom stack trace (used mainly for testing/debugging)
    constructor(
        statusCode,
        message = "Something went wrong.",
        errors = [],
        stack = ""
    ) {
        // Call the parent Error class constructor with the error message
        super(message);

        // Custom properties to structure the error response
        this.statusCode = statusCode;  // HTTP status code (e.g., 400, 500)
        this.data = null;              // Optional field for any additional data (commonly null in error responses)
        this.message = message;        // Error message to send in the response
        this.success = false;          // Indicates that the response represents a failed operation
        this.errors = errors;          // Additional details (e.g., array of validation messages)

        // If a custom stack trace is provided, use it
        if (stack) {
            this.stack = stack;
        } else {
            // Otherwise, capture the current stack trace
            // This attaches a stack trace to where the error was thrown
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

// Export the ApiError class so it can be used in route handlers, middlewares, or service layers
export { ApiError };