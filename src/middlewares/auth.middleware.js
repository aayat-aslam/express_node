// Importing the User model to fetch user info from the database
import { User } from "../models/user.model.js";

// Importing custom error handler class for structured API errors
import { ApiError } from "../utils/ApiError.js";

// Importing a wrapper function that catches async errors (prevents need for repetitive try-catch blocks)
import { asyncHandler } from "../utils/asyncHandler.js";

// Importing jsonwebtoken library to verify the JWT token
import jwt from "jsonwebtoken";

// Middleware to verify JWT from request cookies or Authorization header
export const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        // Extract token from cookies OR from Authorization header (Bearer token)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        // If no token is present, throw Unauthorized error
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        // Verify and decode the token using the secret key
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Fetch the user from the database using ID from decoded token
        // Exclude sensitive fields like password and refreshToken
        const user = await User.findById(decodedToken._id).select("-password -refreshToken");

        // If user is not found, token might be invalid or user might have been deleted
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // Attach the user data to the request object for use in downstream routes
        req.user = user;

        // Proceed to the next middleware or controller
        next();

    } catch (error) {
        // If token is invalid or any other error occurs, respond with Unauthorized
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});