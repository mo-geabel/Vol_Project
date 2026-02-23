const jwt = require('jsonwebtoken');

const protect = (roles = []) => {
  return (req, res, next) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        // Get token from header
        token = req.headers.authorization.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add user info to request
        req.user = decoded;

        // Check assigned roles
        if (roles.length > 0 && !roles.includes(decoded.role)) {
          return res.status(403).json({ message: 'Not authorized: inadequate permissions' });
        }

        next();
      } catch (error) {
        return res.status(401).json({ message: 'Not authorized: invalid token' });
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized: no token' });
    }
  };
};

module.exports = { protect };
