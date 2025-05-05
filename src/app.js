import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Enable Cross-Origin Resource Sharing (CORS) for your Express app
// This allows your backend to accept requests from a different origin (domain/port), which is common in frontend-backend setups

app.use(cors({
    // Only allow requests from the specific origin defined in your environment variable (e.g., frontend URL)
    // Helps prevent unauthorized cross-origin requests
    origin: process.env.CORS_ORIGIN,
    // Allow cookies and other credentials (like Authorization headers) to be included in cross-origin requests
    // This is important when you're using sessions or JWT stored in cookies
    credentials: true
}));

// Parses incoming JSON requests and puts the parsed data in req.body
// The 'limit' option restricts the maximum size of the incoming JSON payload to 16 kilobytes
// Helps prevent large/abusive requests that could affect server performance
app.use(express.json({ limit: "16kb" }));

// Parses incoming requests with URL-encoded payloads (form submissions)
// The 'extended: true' option allows parsing of rich objects and arrays using the qs library
// The 'limit' again restricts the request body size to 16KB
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serves static files (like images, CSS, JS) from the 'public' directory
// e.g., accessing 'public/logo.png' via 'http://localhost:PORT/logo.png'
app.use(express.static("public"));

// Parses incoming request cookies and populates req.cookies
// Useful for reading cookies (e.g., auth tokens, user preferences)
app.use(cookieParser());


import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export { app };