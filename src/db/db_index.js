// Importing required modules
import mongoose from "mongoose"; // Mongoose library for MongoDB object modeling
import { DB_NAME } from "../constants.js" // Importing the database name from constants file

// Asynchronous function to connect to MongoDB
const connectDB = async () => {
    try {
        // Attempt to connect to MongoDB using Mongoose
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);

        // Log the successful connection along with the host information
        console.log(`\nMongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        // Log any errors that occur during the connection attempt
        console.log("MONGO_DB connection error", error);

        // Exit the process with failure code (1) if connection fails
        process.exit(1);
    }
};

// Export the connectDB function to be used in other parts of the application
export default connectDB;