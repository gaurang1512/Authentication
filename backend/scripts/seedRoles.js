import mongoose from "mongoose";
import dotenv from "dotenv";
import { Role } from "../models/Role.js";
import { PERMISSIONS, ROLES } from "../config/permissions.js";
import connectDB from "../config/db.js";

dotenv.config();

const seedRoles = async () => {
  await connectDB();

  const roles = [
    {
      name: ROLES.ADMIN,
      permissions: Object.values(PERMISSIONS), // Admin gets all permissions
      description: "Administrator with full access",
    },
    {
      name: ROLES.USER,
      permissions: [
        PERMISSIONS.READ_USER,
        PERMISSIONS.UPDATE_USER,
      ],
      description: "Standard user",
    },
  ];

  for (const role of roles) {
    const existingRole = await Role.findOne({ name: role.name });
    if (!existingRole) {
      await Role.create(role);
      console.log(`Role ${role.name} created.`);
    } else {
      console.log(`Role ${role.name} already exists. Updating permissions...`);
      existingRole.permissions = role.permissions;
      await existingRole.save();
    }
  }

  console.log("Roles seeded successfully.");
  process.exit();
};

seedRoles();
