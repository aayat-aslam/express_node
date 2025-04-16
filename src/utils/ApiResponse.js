// Define a class called ApiResponse to standardize successful API responses
class ApiResponse {
    
    // Constructor takes in:
    // - statusCode: HTTP status code (e.g., 200, 201, 204)
    // - data: actual response payload (can be object, array, string, etc.)
    // - message: optional custom message (default is "Success")
    constructor(statusCode, data, message = "Success") {
        
        // HTTP status code to indicate success (e.g., 200 OK, 201 Created)
        this.statusCode = statusCode;

        // The main data payload that you want to send in the response
        this.data = data;

        // Optional message to describe the result (default: "Success")
        this.message = message;

        // A boolean flag to indicate if the operation was successful
        // Conventionally, any status code below 400 is considered a success
        this.success = statusCode < 400;
    }
}

export { ApiResponse }