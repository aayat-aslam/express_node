// Import mongoose and Schema to define the data structure for MongoDB documents
import mongoose, { Schema } from "mongoose";

// Import mongoose-aggregate-paginate-v2 plugin for advanced aggregation pagination
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Define the schema for the "Video" collection
const videoSchema = new Schema(
    {
        // The path or URL of the uploaded video file
        videoFile: {
            type: String,            // Must be a string
            required: true           // Required field: cannot create video without a file
        },

        // The path or URL of the video thumbnail image
        thumbnail: {
            type: String,            // Must be a string
            required: true           // Required field for UI display
        },

        // Title of the video
        title: {
            type: String,            // Must be a string
            required: true           // Mandatory for identifying and displaying the video
        },

        // A short or detailed explanation of what the video is about
        description: {
            type: String,            // Must be a string
            required: true           // Helps users understand content & improves SEO
        },

        // Length of the video, typically in seconds
        duration: {
            type: Number,            // Numeric value (e.g., 120 = 2 minutes)
            required: true           // Important for UI controls, user expectations, etc.
        },

        // Number of views this video has received
        views: {
            type: Number,            // Numeric value to represent count
            default: 0               // Default is 0 when a new video is uploaded
        },

        // Indicates if the video is visible to the public
        isPublished: {
            type: Boolean,           // Boolean flag (true/false)
            default: true            // Default is true (visible); can be used for draft mode
        },

        // The user who uploaded the video (relational reference to User collection)
        owner: {
            type: Schema.Types.ObjectId, // ObjectId that references a User
            ref: "User"                  // Mongoose will link to the User model
        }
    },
    {
        // Adds automatic timestamps: createdAt and updatedAt fields
        timestamps: true
    }
);

// Attach the aggregate pagination plugin to the video schema
// This allows use of `.aggregatePaginate()` method with Mongoose aggregations
videoSchema.plugin(mongooseAggregatePaginate);

// Export the model so it can be used throughout the app
// Mongoose will map this schema to the "videos" collection in MongoDB
export const Video = mongoose.model("Video", videoSchema);