// Import multer for handling multipart/form-data (primarily used for uploading files)
import multer from "multer";

/**
 * Configure multer to store uploaded files on disk (locally)
 * using `diskStorage`, which allows customization of the destination folder
 * and filename logic for each file.
 */
const storage = multer.diskStorage({
    /**
     * destination: Specifies the folder where uploaded files will be stored temporarily.
     * 
     * @param {Object} req - The incoming request object
     * @param {Object} file - The file object containing details about the uploaded file
     * @param {Function} cb - Callback function to specify destination
     */
    destination: function (req, file, cb) {
        cb(null, "./public/temp"); // Save all uploaded files in the `public/temp` directory
    },

    /**
     * filename: Specifies how the uploaded file should be named on disk.
     * 
     * @param {Object} req - The incoming request object
     * @param {Object} file - The file object
     * @param {Function} cb - Callback function to specify file name
     */
    filename: function (req, file, cb) {
        // Generate a unique suffix using current timestamp and a random number
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        // Construct the new filename using the original field name + unique suffix
        cb(null, file.fieldname + '-' + uniqueSuffix);

        // Alternate option: Use original file name from user's device
        // cb(null, file.originalname);
    }
});

/**
 * Create a multer instance using the defined storage configuration.
 * 
 * This instance (`upload`) can now be used as middleware in your routes
 * to handle file uploads (e.g., `upload.single("avatar")` or `upload.array("files")`)
 */
export const upload = multer({ storage: storage });