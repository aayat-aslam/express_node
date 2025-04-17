// Import mongoose and Schema constructor to define a MongoDB schema using Mongoose
import mongoose, { Schema } from "mongoose";
// Import bcrypt for securely hashing passwords before saving to the database
import bcrypt from "bcrypt";
// Import jsonwebtoken for creating and signing JWT tokens
import jwt from "jsonwebtoken";

// Define the structure of the User schema using Mongoose
const userSchema = new Schema(
    {
        // Username for the user (used for login or display)
        username: {
            type: String,           // Must be a string
            required: true,         // Required field (cannot be omitted)
            unique: true,           // Must be unique across all users
            lowercase: true,        // Automatically convert to lowercase before saving
            trim: true,             // Remove whitespace from start and end
            index: true             // Index this field for faster lookups
        },

        // User's email address
        email: {
            type: String,           // Must be a string
            required: true,         // Email is a required field
            unique: true,           // Must be unique in the database
            lowercase: true,        // Normalize email by converting to lowercase
            trim: true              // Remove leading/trailing spaces
        },

        // Full name of the user
        fullName: {
            type: String,           // Must be a string
            required: true,         // Required field
            trim: true,             // Clean extra spaces from input
            index: true             // Indexed for better search performance
        },

        // URL or path of the user's avatar/profile picture
        avatar: {
            type: String,           // Must be a string
            required: true          // Avatar is mandatory for user identity
        },

        // Optional cover image URL (for user profile)
        coverImage: {
            type: String            // Not required, optional field
        },

        // Array to store video IDs the user has watched (for watch history)
        watchHistory: [
            {
                type: Schema.Types.ObjectId,  // Each item is a reference (foreign key)
                ref: "Video"                  // Refers to the "Video" model
            }
        ],

        // Hashed password stored securely in the database
        password: {
            type: String,
            required: [true, 'Password is required.'] // Custom error message on missing password
        },

        // Refresh token for session persistence in JWT auth system
        refreshToken: {
            type: String             // Optional field used for secure token refresh
        }
    },
    {
        // Automatically adds `createdAt` and `updatedAt` fields to the document
        timestamps: true
    }
);

// Mongoose pre-save middleware to hash the user's password before saving to the database
userSchema.pre("save", async function (next) {
    /**
     * This middleware is triggered just before a User document is saved to the database.
     * It's commonly used to perform transformations or checks (like hashing passwords).
     *
     * `this` refers to the current document instance being saved.
     */

    // Check if the password field has been modified (or is new)
    // If not, skip hashing and move to the next middleware or save action
    if (!this.isModified("password")) return next();

    /**
     * If the password has been modified (e.g., during user creation or update),
     * we hash it using bcrypt before storing it in the database.
     *
     * `bcrypt.hash()` is an async function that takes two parameters:
     * - the plain text password
     * - the number of salt rounds (10 is a recommended default for security vs. performance)
     */
    this.password = await bcrypt.hash(this.password, 10);

    // Proceed to the next middleware or the actual save operation
    next();
});

// Define a custom instance method(i.e isPasswordCorrect) on the user schema
// This method will be available on all User model instances
userSchema.method.isPasswordCorrect = async function(password) {
    /**
     * This method compares a plain text password with the hashed password stored in the database.
     *
     * @param {string} password - The plain text password entered by the user during login.
     * @returns {Promise<boolean>} - Returns true if the password matches the stored hash, otherwise false.
     * 
     * `this.password` refers to the hashed password on the current user document instance.
     * `bcrypt.compare()` safely compares the input password with the hashed version.
     */
    
    return await bcrypt.compare(password, this.password);
};

// Define an instance method to generate a signed JWT access token for authentication
userSchema.methods.generateAccessToken = function () {
    /**
     * This method creates a JWT access token that can be used for authenticating API requests.
     * The token includes essential user data as payload (such as _id, email, username, fullName).
     * 
     * `jwt.sign(payload, secretKey, options)` is used to sign and create the token.
     * - `payload` contains user-specific data to embed in the token
     * - `process.env.ACCESS_TOKEN_SECRET` is a secret key used to sign the token
     * - `expiresIn` sets the token's validity duration (e.g., '1h', '7d')
     */
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

// Define an instance method to generate a JWT refresh token for session renewal
userSchema.methods.generateRefreshToken = function () {
    /**
     * This method generates a long-lived refresh token for renewing access tokens
     * without requiring the user to log in again.
     * 
     * Only minimal information (like `_id`) is embedded to keep the payload lightweight.
     * 
     * `process.env.REFRESH_TOKEN_SECRET` is used to sign this token.
     * `process.env.REFRESH_TOKEN_EXPIRY` controls how long this token remains valid.
     */
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};


// Export the compiled Mongoose model named "User"
// This model will interact with the `users` collection in MongoDB
export const User = mongoose.model("User", userSchema);