// Importing asyncHandler from utility functions
// asyncHandler is usually a wrapper function that catches errors in async functions
// and passes them to the Express error handling middleware.
import { asyncHandler } from "../utils/asyncHandler.js";

// Define the registerUser controller function
// It's wrapped in asyncHandler to ensure any asynchronous errors are caught
// and forwarded to the error-handling middleware.

// TO DO
const registerUser = asyncHandler( async ( req, res, next) => {
    // Sending a 200 OK response with a JSON object containing a message
    res.status(200).json({
        message: "ok"
    });
});

// Export the registerUser function so it can be used in route definitions
export { registerUser };