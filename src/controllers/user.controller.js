// Importing asyncHandler from utility functions
// asyncHandler is usually a wrapper function that catches errors in async functions
// and passes them to the Express error handling middleware.
import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { uploadOnCloudinary, deletFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validateRegistrationInput } from "../validations/user.validate.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { json } from "express";

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
const loginUser = asyncHandler( async (req, res) => {

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
const logoutUser = asyncHandler( async (req, res) => {
    // Clear the user's refreshToken in the database
    // This ensures the refresh token is invalidated and can't be reused
    await User.findByIdAndUpdate(
        req.user._id, // Identify the user based on the authenticated request
        {
            $unset: {
                refreshToken: 1  // Remove/clear the refreshToken field
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

// Controller to refresh access token using a valid refresh token
const refreshAccessToken = asyncHandler( async (req, res) => {
    
    // Get refresh token from either cookies or request body
    // This is useful for flexibility across browser-based and API clients
    const incommingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    // If no refresh token is provided, the request is unauthorized
    if (!incommingRefreshToken || String(incommingRefreshToken).trim() === "undefined") {
        throw new ApiError(401, "Unauthorized request, refresh token is undefined");
    }

    try {
        // Verify the refresh token using the server's secret
        // This step decodes the token payload (typically includes the user ID)
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Find the user in the database based on the decoded user ID from the refresh token
        const user = await User.findById(decodedToken?._id);

        // If the user is not found, the refresh token is invalid
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }

        // Compare the token received from the client with the token stored in the database
        // If they do not match, the token may be reused or expired (invalid session)
        if (incommingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        // Cookie security options
        const options = {
            httpOnly: true, // Prevents JavaScript access to cookies (helps mitigate XSS attacks)
            secure: true    // Sends cookies only over HTTPS (recommended for production)
        };

        // Generate a new access token and a new refresh token
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        // Send the new tokens back as HTTP-only cookies and in the response body
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)         // Set new access token in cookie
            .cookie("refreshToken", refreshToken, options)   // Set new refresh token in cookie
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken
                    },
                    "AccessToken Refreshed"
                )
            );
    } catch (error) {
        // Catch all token verification or DB errors and throw an appropriate response
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

// Controller to handle password change functionality for a logged-in user
const chnageCurrentPassword = asyncHandler( async (req, res) => {
    
    // Extract current and new passwords from the request body
    const { currentPassword, newPassword } = req.body;

    // Validate current password presence and non-empty value
    if (!currentPassword || currentPassword.trim() === "") {
        throw new ApiError(400, "Current password is required");
    }

    // Validate new password presence and non-empty value
    if (!newPassword || newPassword.trim() === "") {
        throw new ApiError(400, "New password is required");
    }

    // Find the user based on the authenticated user ID (set in previous auth middleware)
    const user = await User.findById(req.user._id);

    // If user not found, return 404 error
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Compare the currentPassword entered by the user with the hashed password in DB
    const isPasswordValid = await user.isPasswordCorrect(currentPassword);

    // If current password does not match, throw unauthorized error
    if (!isPasswordValid) {
        throw new ApiError(401, "Current password is incorrect");
    }

    // Prevent setting the same password as the new one
    if (currentPassword === newPassword) {
        throw new ApiError(400, "New password must be different from the current password");
    }

    // Set the new password (this will be hashed automatically if pre-save hook is used)
    user.password = newPassword;

    // Save the updated user object without running other validations (e.g., email format, etc.)
    await user.save({ validateBeforeSave: false });

    // Respond to the client with a success message
    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    );
});

// Controller to get logged-in user's account details
const getAccountDetails = asyncHandler(async (req, res) => {
    // Fetch the user from the database using the ID from the authenticated request
    // `select("-password")` ensures the password field is excluded from the result for security
    const user = await User.findById(req.user?._id).select("-password");

    // If no user is found with the given ID, respond with a 404 error
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // If user exists, return a 200 response with user data and a success message
    return res.status(200).json(
        new ApiResponse(
            200,     // HTTP status code
            user,    // Data to send in the response (user object without password)
            "User Details Fetched"  // Message
        )
    );
});

// Controller to handle account detail updates (full name and email)
const changeAccountDetails = asyncHandler(async (req, res) => {

    // Destructure updated values from the request body
    const { fullName, email } = req.body;

    // Validate presence of both fields (prevent partial updates)
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required"); // Return 400 Bad Request if any field is missing
    }

    // Update the user's fullName and email in the database
    const user = await User.findByIdAndUpdate(
        req.user?._id,                // Use the authenticated user's ID from the request (set via middleware)
        {
            $set: { fullName, email } // Set the new values for fullName and email
        },
        {
            new: true                 // Return the updated document instead of the original
        }
    ).select("-password");            // Exclude the password field from the returned user object for security

    // Return a success response with the updated user details
    return res
        .status(200)  // HTTP OK
        .json(new ApiResponse(200, user, "Account updated successfully"));
});

// Function to change the user's avatar
const changeUserAvatar = asyncHandler(async (req, res) => {
    
    // Get the local file path of the uploaded avatar from the request
    const avatarImageLocalPath = req.file?.path;

    // If no file was uploaded, throw an error
    if (!avatarImageLocalPath) {
        throw new ApiError(400, "Avatar image file is missing");
    }

    // Fetch the current avatar's Cloudinary URL from the database (excluding _id)
    const avatarCloudinaryFilePath = (
        await User.findById(req.user?._id).select("avatar -_id")
    ).avatar;

    // If an existing avatar exists on Cloudinary, attempt to delete it
    if (avatarCloudinaryFilePath) {
        const oldAvatarImage = await deletFromCloudinary(avatarCloudinaryFilePath);

        // If deletion failed, throw an error
        if (!oldAvatarImage) {
            throw new ApiError(404, "Error while deleting file from Cloudinary");
        }
    }

    // Upload the new avatar image to Cloudinary
    const avatarImage = await uploadOnCloudinary(avatarImageLocalPath);

    // If Cloudinary did not return a URL, throw an error
    if (!avatarImage.url) {
        throw new ApiError(400, "Error while uploading the avatar to Cloudinary");
    }

    // Update the user's avatar URL in the database and return the new user object (excluding password)
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatarImage.url, // Store the new Cloudinary URL in the DB
            },
        },
        {
            new: true, // Return the updated user document
        }
    ).select("-password"); // Exclude password from the result

    // Respond with success and the updated user data
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

// Function to change the user's cover image
const changeUserCoverImage = asyncHandler(async (req, res) => {
    
    // Get the local file path of the uploaded cover image from the request
    const coverImageLocalPath = req.file?.path;

    // If no file was uploaded, throw an error
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    // Fetch the current coverImage's Cloudinary URL from the database (excluding _id)
    const coverImageCloudinaryFilePath = (
        await User.findById(req.user?._id).select("coverImage -_id")
    ).coverImage;

    // If an existing cover image exists on Cloudinary, attempt to delete it
    if (coverImageCloudinaryFilePath) {
        const oldCoverImage = await deletFromCloudinary(coverImageCloudinaryFilePath);

        // If deletion failed, throw an error
        if (!oldCoverImage) {
            throw new ApiError(404, "Error while deleting file from Cloudinary");
        }
    }

    // Upload the new cover image to Cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // If Cloudinary did not return a URL, throw an error
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading the cover image to Cloudinary");
    }

    // Update the user's coverImage URL in the database and return the new user object (excluding password)
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url, // Store the new Cloudinary URL in the DB
            },
        },
        {
            new: true, // Return the updated user document
        }
    ).select("-password"); // Exclude password from the result

    // Respond with success and the updated user data
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    // Extract username from request parameters
    const { username } = req.params;

    // Validate the username input
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing");
    }

    // Perform an aggregation query to fetch user channel profile and related data
    const channel = await User.aggregate(
        [
            {
                // Match user document with the provided username (case-insensitive)
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                // Lookup to fetch users who have subscribed to this channel (current user)
                $lookup: {
                    from: "subscriptions",          // Collection name to join from
                    localField: "_id",              // Field from User collection
                    foreignField: "channel",        // Field from Subscription collection
                    as: "subscribers"               // Output array field name
                }
            },
            {
                // Lookup to fetch channels this user is subscribed to
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                // Add computed fields: subscribers count, subscriptions count, and isSubscribed flag
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"       // Count number of subscribers
                    },
                    channelSubscribedToCount: {
                        $size: "$subscribedTo"      // Count number of channels the user has subscribed to
                    },
                    isSubscribed: {
                        // Check if the logged-in user is one of the subscribers
                        $cond: {
                            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                // Select only necessary fields to return in the response
                $project: {
                    username: 1,
                    email: 1,
                    fullName: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribersCount: 1,
                    channelSubscribedToCount: 1,
                    isSubscribed: 1
                }
            }
        ]
    );

    // If no channel/user found, throw error
    if (!channel?.length) {
        throw new ApiError(400, "Channel does not exists");
    }

    // Send back user channel info in response
    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "User channel fetched successfully."));
});

const getWatchHistory = asyncHandler(async (req, res) => {

    // Perform an aggregation query on the User collection to fetch detailed watch history
    const user = await User.aggregate([
        {
            // Match the user document using the ID from the authenticated request (req.user._id)
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            // Perform a lookup to join the User's 'watchHistory' array with the 'videos' collection
            $lookup: {
                from: "videos",                        // Collection to join with (videos)
                localField: "watchHistory",            // Field in the User document (array of video IDs)
                foreignField: "_id",                   // Matching field in the Video document (_id)
                as: "watchHistory",                    // Output array field to store matched video documents
                
                // Use a nested pipeline to further enrich the video data with owner info
                pipeline: [
                    {
                        // Lookup the 'owner' of each video from the 'users' collection
                        $lookup: {
                            from: "users",             // Collection to join with (users)
                            localField: "owner",       // Field in the Video document (owner ID)
                            foreignField: "_id",       // Matching field in the User document
                            as: "owner",               // Output array field to store matched owner info
                            pipeline: [
                                {
                                    // Project only selected fields from the owner
                                    $project: {
                                        fullName: 1,   // Include full name
                                        username: 1,   // Include username
                                        avatar: 1      // Include avatar URL
                                    }
                                }
                            ]
                        }
                    },
                    {
                        // Flatten the owner array to a single object using $first
                        $addFields: {
                            owner: {
                                $first: "$owner"       // Extract first (and expected only) owner document
                            }
                        }
                    }
                ]
            }
        }
    ]);

    return res
    .status(200),
    json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully.")
    )
})

const subscribeChannel = asyncHandler(async (req, res) => {
    const subscriberId = req.user._id; // Authenticated user making the request
    const { channelId } = req.body;    // ID of the user being subscribed to

    // Validate input
    if (!channelId) {
        throw new ApiError(400, "Channel ID is required.");
    }

    if (subscriberId.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to your own channel.");
    }

    // Check if the channel exists
    const channelUser = await User.findById(channelId);
    if (!channelUser) {
        throw new ApiError(400, "Channel not found.");
    }

    // Check for an existing subscription
    const alreadySubscribed = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    });

    if (alreadySubscribed) {
        throw new ApiError(400, "Already subscribed to this channel.");
    }

    // Create and save the new subscription
    const newSubscription = await Subscription.create({
        subscriber: subscriberId,
        channel: channelId
    });

    return res
    .status(201)
    .json(new ApiResponse(200, newSubscription, "Channel subscribed successfully."));
});

// Export the registerUser function so it can be used in route definitions
export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    chnageCurrentPassword, 
    getAccountDetails, 
    changeAccountDetails,
    changeUserAvatar,
    changeUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    subscribeChannel
};