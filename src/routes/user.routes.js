// Importing the Router function from the express module
// Router allows us to create modular, mountable route handlers
import { Router } from "express";

// Importing the registerUser controller function
// This function will handle the logic for user registration
import { registerUser } from "../controllers/user.controller.js";

// Creating a new router instance for handling user-related routes
const userRouter = Router();

// Defining a POST route for "/register"
// When a POST request is made to /register, the registerUser controller will handle it
userRouter.route("/register").post(registerUser);

// Exporting the userRouter so it can be used in other parts of the application,
// typically to be mounted in the main app (e.g., app.use("/api/users", userRouter))
export default userRouter;