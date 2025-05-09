// Importing asyncHandler from utility functions
// asyncHandler is usually a wrapper function that catches errors in async functions
// and passes them to the Express error handling middleware.
import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validateRegistrationInput } from "../validations/user.validate.js";

// Function to generate a new access token and refresh token for a user
const generateAccessAndRefreshToken = async (userId) => {
    try {
        // 1. Fetch the user from the database using the provided user ID
        const user = await User.findById(userId);

        // 2. Generate a new access token for short-term authentication
        const accessToken = user.generateAccessToken();

        // 3. Generate a new refresh token for renewing the access token without re-authenticating
        const refreshToken = user.generateRefreshToken();

        // 4. Save the newly generated refresh token in the user's record in the database
        //    This allows the server to validate future refresh requests
        user.refreshToken = refreshToken;

        // 5. Save the user document but skip all Mongoose validations for performance
        await user.save({ validateBeforeSave: false });

        // 6. Return both tokens so they can be sent back to the client
        return { accessToken, refreshToken };

    } catch (error) {
        // If an error occurs at any point (DB issues, token generation failure), throw a custom API error
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

// Define the registerUser controller function
// It's wrapped in asyncHandler to ensure any asynchronous errors are caught
// and forwarded to the error-handling middleware.

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
    // const fields = { fullName, username, email, password };

    // Define custom error messages for each field
    // These will be shown if the field is missing or empty
    // const errorMessages = {
    //     fullName: `\n \n - fullName is required and should not be empty!`,
    //     username: `\n - username is required and should not be empty!`,
    //     email: `\n - email is required and should not be empty!`,
    //     password: `\n - password is required and should not be empty! \n`
    // };

    // Validate each field:
    // - Object.entries(fields) converts the fields object into an array of [key, value] pairs
    // - .filter() checks if the value is undefined, null, or an empty string after trimming
    // - .map() transforms the filtered keys into their corresponding error messages
    // const errors = Object.entries(fields)
    //     .filter(([key, value]) => value === undefined || value === null || value?.trim() === "")
    //     .map(([key]) => errorMessages[key]);

    // If any validation errors are found, throw an error with status 400 (Bad Request)
    // The error message combines all missing/invalid field messages into one
    // if (errors.length > 0) {
    //     throw new ApiError(400, errors.join(`\n`));
    // }

    const validationErrors = validateRegistrationInput({ fullName, username, email, password });

    if (validationErrors.length > 0) {
        throw new ApiError(400, `\n\n${validationErrors.join("\n")}\n\n`);
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

// Controller function to handle user login
const loginUser = asyncHandler(async (req, res) => {

    // req.body -> data
    // username or email
    // find the user
    // password check
    // generate access and refresh token
    // send cookie

    // Extracting login credentials from the request body
    const { email, username, password } = req.body;

    // Ensure that either email or username is provided
    if (!email && !username) {
        throw new ApiError(400, "username or email is required");
    }

    // Find user by either email or username using MongoDB's $or query
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    // If no user is found, return a 404 error
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Validate the entered password with the stored hashed password
    const isPasswordValid = await user.isPasswordCorrect(password);

    // If password is invalid, return a 401 Unauthorized error
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Generate access and refresh tokens for the authenticated user
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // Retrieve the user again, excluding sensitive fields like password and refreshToken
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Cookie options to enhance security
    const options = {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: true    // Ensures the cookie is sent over HTTPS only (production best practice)
    };

    // Send the access and refresh tokens in secure HTTP-only cookies and user info in response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, // sanitized user object
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});

// Controller to handle user logout logic
const logoutUser = asyncHandler(async (req, res) => {
    // Clear the user's refreshToken in the database
    // This ensures the refresh token is invalidated and can't be reused
    await User.findByIdAndUpdate(
        req.user._id, // Identify the user based on the authenticated request
        {
            $set: {
                refreshToken: undefined  // Remove/clear the refreshToken field
            }
        },
        {
            new: true // Return the modified document (optional in this case since we're not using it)
        }
    );

    // Cookie options to enhance security
    const options = {
        httpOnly: true, // Makes the cookie inaccessible to JavaScript running in the browser (mitigates XSS attacks)
        secure: true    // Ensures the cookie is only sent over HTTPS (important in production)
    };

    // Clear the access and refresh tokens from cookies and respond to the client
    return res
        .status(200)
        .clearCookie("accessToken", options)  // Clear the accessToken cookie
        .clearCookie("refreshToken", options) // Clear the refreshToken cookie
        .json(
            new ApiResponse(200, {}, "User Logged Out")  // Send success response with message
        );
});

// Export the registerUser function so it can be used in route definitions
export { registerUser, loginUser, logoutUser };