// Importing Mongoose and Schema constructor for defining the schema
import mongoose, { Schema } from "mongoose";

// Import the User model to reference it in the schema
import { User } from "./user.model";

// Define the schema for a subscription relationship between users
const subscriptionSchema = new Schema(
    {
        // 'subscriber' is the user who subscribes to a channel (another user)
        subscriber: {
            type: Schema.Types.ObjectId, // Stores MongoDB ObjectId
            ref: User                   // Refers to the 'User' model
        },

        // 'channel' is the user who is being subscribed to
        channel: {
            type: Schema.Types.ObjectId, // Stores MongoDB ObjectId
            ref: User                   // Refers to the 'User' model
        }
    },
    {
        // Automatically adds 'createdAt' and 'updatedAt' fields to track changes
        timestamps: true
    }
);

// Create and export the Mongoose model named 'Subscription' using the schema
export const Subscription = mongoose.model("Subscription", subscriptionSchema);