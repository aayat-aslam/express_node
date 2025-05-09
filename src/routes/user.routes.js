// Importing the Router function from the express module
// Router allows us to create modular, mountable route handlers
import { Router } from "express";

// Importing the multer middleware configuration.
// 'upload' is a custom middleware created to handle file uploads (e.g., images).
import { upload } from "../middlewares/multer.middleware.js"

// Importing the registerUser controller function
// This function will handle the logic for user registration
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

// Creating a new router instance for handling user-related routes
const userRouter = Router();

// Defining a POST route for the "/register" endpoint.
// When a POST request is made to this endpoint, two things happen:
// 1. The `upload.fields()` middleware runs first to handle image uploads (avatar and coverImage).
// 2. Then, the `registerUser` controller function runs to process the request data and register the user.
// userRouter.route("/register").post(registerUser);        // Register route without middleware
userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",         // Accepts a field named 'avatar'
            maxCount: 1             // Allows uploading only 1 avatar file
        },
        {
            name: "coverImage",     // Accepts a field named 'coverImage'
            maxCount: 1             // Allows uploading only 1 avatar file
        }
    ]),
    registerUser                    // Controller function to handle the actual registration logic
);

userRouter.route("/login").post(loginUser);

userRouter.route("/logout").post( verifyJwt, logoutUser)
userRouter.route("/refresh-token").post(refreshAccessToken)

// Exporting the userRouter so it can be used in other parts of the application,
// typically to be mounted in the main app (e.g., app.use("/api/users", userRouter))
export default userRouter;