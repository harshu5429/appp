import jwt from 'jsonwebtoken';

// JWT secret key - required from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Fail fast if JWT_SECRET is missing in production
if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}
const JWT_EXPIRES_IN = '7d';

/**
 * Generate a JWT token for a user
 */
export const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Authentication middleware - extracts and validates JWT token
 */
export const authenticateUser = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Authentication required. Please provide a valid Bearer token.',
      statusCode: 401
    };
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return {
      success: false,
      error: 'Invalid or expired token. Please login again.',
      statusCode: 401
    };
  }
  
  return {
    success: true,
    user: decoded
  };
};

/**
 * Authorization helper - verifies user can access specific resource
 */
export const authorizeUser = (authenticatedUserId, pathUserId) => {
  const pathUserIdInt = parseInt(pathUserId);
  
  if (isNaN(pathUserIdInt)) {
    return {
      success: false,
      error: 'Invalid user ID in path.',
      statusCode: 400
    };
  }
  
  if (authenticatedUserId !== pathUserIdInt) {
    return {
      success: false,
      error: 'Access denied. You can only access your own data.',
      statusCode: 403
    };
  }
  
  return {
    success: true,
    userId: pathUserIdInt
  };
};

/**
 * Authorization helper for resource ownership
 */
export const authorizeResourceOwnership = (authenticatedUserId, resourceUserId) => {
  if (authenticatedUserId !== resourceUserId) {
    return {
      success: false,
      error: 'Access denied. You can only modify your own resources.',
      statusCode: 403
    };
  }
  
  return {
    success: true
  };
};

/**
 * Send authentication error response
 */
export const sendAuthError = (res, error) => {
  res.writeHead(error.statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: error.error,
    code: 'AUTHENTICATION_ERROR'
  }));
};

/**
 * Send authorization error response
 */
export const sendAuthzError = (res, error) => {
  res.writeHead(error.statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: error.error,
    code: 'AUTHORIZATION_ERROR'
  }));
};

/**
 * Combined authentication and authorization check
 */
export const authenticateAndAuthorize = (req, pathUserId) => {
  // First authenticate the user
  const authResult = authenticateUser(req);
  if (!authResult.success) {
    return authResult;
  }
  
  // Then authorize access to the specific resource
  const authzResult = authorizeUser(authResult.user.userId, pathUserId);
  if (!authzResult.success) {
    return authzResult;
  }
  
  return {
    success: true,
    user: authResult.user,
    userId: authzResult.userId
  };
};

/**
 * Get public endpoints that don't require authentication
 */
export const getPublicEndpoints = () => {
  return [
    'POST:/api/users',           // User registration
    'POST:/api/users/login',     // User login
    'GET:/api/achievements',     // Public achievements list
    'GET:/api/rewards',          // Public rewards catalog
    'GET:/api/education/modules', // Public education modules
    'GET:/api/seasonal-challenges', // Public seasonal challenges
    'GET:/api/teams',            // Public teams list
    'GET:/api/communities',      // Public communities list
    'GET:/api/group-goals'       // Public group goals
  ];
};

/**
 * Check if endpoint is public (doesn't require authentication)
 */
export const isPublicEndpoint = (method, path) => {
  const publicEndpoints = getPublicEndpoints();
  const endpoint = `${method}:${path}`;
  
  return publicEndpoints.includes(endpoint);
};