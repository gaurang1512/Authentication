import { Role } from "../models/Role.js";
import { redisClient } from "../index.js";

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: User not authenticated." });
      }

      const userRoleName = req.user.role;
      
      // Try to get permissions from Redis
      const cacheKey = `role:${userRoleName}`;
      let permissions = await redisClient.get(cacheKey);

      if (permissions) {
        permissions = JSON.parse(permissions);
      } else {
        // Fetch from DB if not in cache
        const role = await Role.findOne({ name: userRoleName });
        
        if (!role) {
            // Fallback: If role not found in DB, assume no permissions or basic user permissions?
            // For security, better to deny if role definition is missing.
             return res.status(403).json({ message: "Forbidden: Role not defined." });
        }

        permissions = role.permissions;
        // Cache for 1 hour
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(permissions));
      }

      if (permissions.includes(requiredPermission)) {
        return next();
      }

      return res.status(403).json({ message: "Forbidden: Insufficient permissions." });

    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ message: "Internal Server Error during authorization." });
    }
  };
};
