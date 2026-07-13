import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";

/**
 * Authenticates requests using JWT Access Tokens.
 * Exposes `request.user` with userId, email, role, and permissions.
 */
export async function authenticate(request, reply) {
  const authHeader = request.headers.authorization;
  request.log.info({ authHeader }, "Authentication request received");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authentication token is missing or malformed.");
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    
    // Check if session is still valid in database if needed, or simply trust token.
    // For high performance, we trust token. For strict control, we can query Redis or DB.
    // We attach user info to request.
    request.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new UnauthorizedError("Authentication token has expired.");
    }
    throw new UnauthorizedError("Invalid authentication token.");
  }
}

/**
 * Authorizes requests based on Roles.
 * Must be executed after authenticate preHandler hook.
 *
 * @param {string[]} allowedRoles - List of authorized roles.
 */
export function authorizeRoles(allowedRoles) {
  return async (request, reply) => {
    if (!request.user) {
      throw new UnauthorizedError("User is not authenticated.");
    }

    const { role } = request.user;
    const hasRole = allowedRoles.includes(role) || role === "Super Admin";

    if (!hasRole) {
      throw new ForbiddenError("You do not have permission to access this resource.");
    }
  };
}

/**
 * Authorizes requests based on Permissions.
 * Must be executed after authenticate preHandler hook.
 *
 * @param {string[]} requiredPermissions - List of authorized permissions.
 */
export function authorizePermissions(requiredPermissions) {
  return async (request, reply) => {
    if (!request.user) {
      throw new UnauthorizedError("User is not authenticated.");
    }

    const { role, permissions } = request.user;
    
    // Super Admin bypassed
    if (role === "Super Admin") {
      return;
    }

    const hasPermission = requiredPermissions.every((perm) => permissions.includes(perm));

    if (!hasPermission) {
      throw new ForbiddenError("You do not have the required permissions to perform this action.");
    }
  };
}

/**
 * Optional authentication preHandler hook.
 * Decodes user token if provided, but does not throw errors if missing/invalid.
 */
export async function optionalAuthenticate(request, reply) {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      request.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || []
      };
    } catch (err) {
      // Silently fall back to guest
    }
  }
}
