const jwt = require('jsonwebtoken');

exports.authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        // Replace 'your_jwt_secret' with your actual JWT secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach decoded user info to the request object
        req.user = decoded;

        // Continue to the next middleware/route handler
        next();
    } catch (error) {
        return res.status(400).json({ message: 'Invalid token.', error: error.message });
    }
};
