// Importing required modules
import dotenv from "dotenv";
import connectDB from "./db/db_index.js";

dotenv.config({
    path: './env'
})
connectDB();






/*
// Creating an Express application instance
const app = express();

// Immediately Invoked Function Expression (IIFE) to handle async initialization
(async () => {
    try {
        // Attempt to connect to MongoDB using Mongoose
        await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);

        // Handling application-level errors
        app.on("error", (error) => {
            console.log("Error", error); // Log any error that occurs
            throw error; // Rethrow the error to be handled by the catch block
        });

        // Start the server and listen on the specified port
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        });
    } catch (error) {
        // Catch and log any errors during the initialization process
        console.log("Error", error);
        throw error;
    }
})();
*/