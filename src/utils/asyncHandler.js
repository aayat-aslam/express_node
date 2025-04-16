// Define a asyncHandler function that takes a requestHandler function as its argument.
// This is a higher-order function commonly used in Express.js to handle errors in asynchronous route handlers.
const asyncHandler = (requestHandler) => {

    // Return a middleware function following the Express.js format: (req, res, next)
    // This returned function will be used as a wrapper around your actual route/controller logic.
    return (req, res, next) => {

        // Use Promise.resolve to handle both synchronous and asynchronous functions.
        // This ensures that if requestHandler is async and throws/rejects, the error will be caught below.
        Promise
            .resolve(requestHandler(req, res, next)) // Invoke the actual request handler
            .catch((error) => next(error)); // Catch any error and pass it to Express's error handler via next()
    }
}
export { asyncHandler }

// const asyncHandler = () => {}
// const asyncHandler = (func) =>  () => {} 
// const asyncHandler = (func) =>  async () => {} 
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error){
//         res.status(error.code || 500).json({ success: false, message: error.message})
//     }
// }