// Importing asyncHandler from utility functions
// asyncHandler is usually a wrapper function that catches errors in async functions
// and passes them to the Express error handling middleware.
import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Define the registerUser controller function
// It's wrapped in asyncHandler to ensure any asynchronous errors are caught
// and forwarded to the error-handling middleware.

// TO DO
const registerUser = asyncHandler( async ( req, res, next) => {

    // get user details from frontend
    // validation - not empty
    // check if user lready exists: username / email
    // check for images / check for avatar
    // upload them to the another server(cloudinary), avatar
    // hash password before user creation
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    // Destructure the required fields from the request body
    const { fullName, username, email, password } = req.body;

    // Create an object that maps field names to their respective values
    // This helps in iterating over the fields easily for validation
    const fields = { fullName, username, email, password };

    // Define custom error messages for each field
    // These will be shown if the field is missing or empty
    const errorMessages = {
        fullName: `\n \n - fullName is required and should not be empty!`,
        username: `\n - username is required and should not be empty!`,
        email: `\n - email is required and should not be empty!`,
        password: `\n - password is required and should not be empty! \n`
    };

    // Validate each field:
    // - Object.entries(fields) converts the fields object into an array of [key, value] pairs
    // - .filter() checks if the value is undefined, null, or an empty string after trimming
    // - .map() transforms the filtered keys into their corresponding error messages
    const errors = Object.entries(fields)
        .filter(([key, value]) => value === undefined || value === null || value?.trim() === "")
        .map(([key]) => errorMessages[key]);

    // If any validation errors are found, throw an error with status 400 (Bad Request)
    // The error message combines all missing/invalid field messages into one
    if (errors.length > 0) {
        throw new ApiError(400, errors.join(`\n`));
    }

    // Check if a user already exists with the same email or username
    const ExistedUser = await User.findOne({
        $or: [ { username }, { email }]
    })

    // If a user is found, throw a 409 Conflict error
    if(ExistedUser){
        throw new ApiError( 409, "Email or Username already exists")
    }

    // Retrieve avatar and cover image file paths from the request
    // Only fetch the first file if multiple are uploaded
    const avatarLocalPath = Array.isArray(req.files?.avatar) && req.files.avatar.length > 0 ? req.files.avatar[0].path : null;
    const coverImageLocalPath = Array.isArray(req.files?.coverImage) && req.files.coverImage.length > 0 ? req.files.coverImage[0].path : null;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    // Upload avatar and cover image to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // If avatar upload failed (e.g. Cloudinary error), throw error
    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }

    // Create a new user record in the database
    // Note: password hashing should be handled in the User model's pre-save hook
    const user = await User.create({
        username: username.toLowerCase(), // Store username in lowercase
        email,
        fullName,
        avatar: avatar.url, // Store Cloudinary avatar URL
        coverImage: coverImage?.url || "", // Store cover image if uploaded
        password // Plain password; should be hashed via Mongoose middleware
    });

    // Retrieve the newly created user, excluding sensitive fields
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // If user creation failed (edge case), throw internal server error
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Sending a 200 OK response with a JSON object containing a message
    // res.status(200).json({
    //     message: "ok",
    // });
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User register successfully")
    )
});

// Export the registerUser function so it can be used in route definitions
export { registerUser };