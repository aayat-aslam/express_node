// Importing Mongoose library and Schema constructor from it
import mongoose, { Schema } from "mongoose";

// Define a Mongoose schema for managing subscriptions between users
const subscriptionSchema = new Schema(
    {
        // 'subscriber' represents the user who is subscribing to another user's channel
        subscriber: {
            type: Schema.Types.ObjectId, // Reference to the subscribing user's ObjectId
            ref: "User",                 // Refers to the 'User' model (for population purposes)
            required: true              // Ensures that a subscriber is always specified
        },

        // 'channel' represents the user (channel owner) being subscribed to
        channel: {
            type: Schema.Types.ObjectId, // Reference to the channel user's ObjectId
            ref: "User",                 // Refers to the 'User' model (for population purposes)
            required: true              // Ensures that a channel is always specified
        }
    },
    {
        // Mongoose will automatically add `createdAt` and `updatedAt` fields to each document
        timestamps: true
    }
);

// Create the Mongoose model named 'Subscription' using the defined schema
// This model represents the subscription relationships in the database
export const Subscription = mongoose.model("Subscription", subscriptionSchema);