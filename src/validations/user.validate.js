
// This function takes user input data and returns an array of error messages (if any validations fail)
export const validateRegistrationInput = (data = {}) => {
    // Destructure fields from the input object, defaulting to empty strings to avoid undefined issues
    const { fullName = "", username = "", email = "", password = "" } = data;

    // Initialize an array to store validation error messages
    const errors = [];

    // ---- Full Name Validation ----
    // Check if fullName is empty after trimming whitespace
    if (!fullName.trim()) {
        errors.push("- fullName is required and should not be empty.");
    }
    // Check if fullName length is between 3 and 50 characters
    else if (fullName.length < 3 || fullName.length > 50) {
        errors.push("- fullName must be between 3 and 50 characters.");
    }

    // ---- Username Validation ----
    // Check if username is empty after trimming
    if (!username.trim()) {
        errors.push("- username is required and should not be empty.");
    }
    // Check if username contains only letters, numbers, and underscores
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push("- username can only contain letters, numbers, and underscores.");
    }
    // Ensure username length is within valid limits
    else if (username.length < 3 || username.length > 30) {
        errors.push("- username must be between 3 and 30 characters.");
    }

    // ---- Email Validation ----
    // Check if email is empty after trimming
    if (!email.trim()) {
        errors.push("- email is required and should not be empty.");
    }
    // Use a basic regex to validate email format (simple but widely effective)
    else if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.push("- email must be a valid email address.");
    }

    // ---- Password Validation ----
    // Check if password is empty after trimming
    if (!password.trim()) {
        errors.push("- password is required and should not be empty.");
    } else {
        // Check if password length is between 8 and 100 characters
        if (password.length < 8 || password.length > 100) {
            errors.push("- password must be between 8 and 100 characters.");
        }
        // Ensure password includes at least one uppercase letter
        if (!/[A-Z]/.test(password)) {
            errors.push("- password must contain at least one uppercase letter.");
        }
        // Ensure password includes at least one lowercase letter
        if (!/[a-z]/.test(password)) {
            errors.push("- password must contain at least one lowercase letter.");
        }
        // Ensure password includes at least one number
        if (!/[0-9]/.test(password)) {
            errors.push("- password must contain at least one number.");
        }
        // Ensure password includes at least one special character from the listed set
        if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)) {
            errors.push("- password must contain at least one special character.");
        }
    }

    // Return the array of error messages
    // If empty, input is valid; if not, errors should be shown to the user
    return errors;
};