import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//This is enough for cors, but we will use cors with some settings
// app.use(cors());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export { app };