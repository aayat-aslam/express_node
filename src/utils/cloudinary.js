// Import the v2 version of Cloudinary SDK for Node.js
import { v2 as cloudinary } from 'cloudinary';

// Import 'fs' module to interact with the file system (e.g., delete temp files)
import fs from "fs";

// Configure Cloudinary with credentials from environment variables (.env file)
// These credentials are necessary for authenticating API requests to Cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARI_CLOUD_NAME,   // Your Cloudinary cloud name
    api_key: process.env.CLOUDINARI_API_KEY,         // API Key from Cloudinary dashboard
    api_secret: process.env.CLOUDINARI_API_SECRET    // API Secret from Cloudinary dashboard
});

/**
 * Asynchronously uploads a file to Cloudinary using its local file path.
 * 
 * @param {string} localFilePath - The full path of the file stored locally on the server.
 * @returns {Promise<Object|null>} - Returns the Cloudinary upload result object if successful, or null if an error occurs.
 */
const uploadOnCloudinary = async (localFilePath) => {
    try {
        // If no file path is provided, skip upload
        if (!localFilePath) return null;

        /**
         * Upload the file to Cloudinary
         * 
         * `resource_type: "auto"` allows Cloudinary to automatically detect the file type
         * (image, video, raw, etc.) and store it accordingly.
         */
        const uploadResult = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto"  // Automatically determine the resource type (image/video/etc.)
            }
        );

        // Log the Cloudinary URL where the file is now hosted
        // console.log("File is uploaded on Cloudinary:", uploadResult.url);

        fs.unlinkSync(localFilePath);
        // Return the entire result object (includes URL, public_id, etc.)
        return uploadResult;

    } catch (error) {
        /**
         * If any error occurs during upload (e.g., network issue, invalid file),
         * remove the temporary file from the local file system to prevent clutter.
         */
        fs.unlink(localFilePath, (err) => {
            if (err) console.error("Error deleting local file:", err);
        });

        // Return null to indicate failure
        return null;
    }
}

// Export the function so it can be used in other parts of the application
export { uploadOnCloudinary };