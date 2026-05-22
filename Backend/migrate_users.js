import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from './src/models/user.model.js';

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const usersToMigrate = await User.find({ role: 'user' });
  console.log(`Found ${usersToMigrate.length} users with legacy role 'user'`);
  
  if (usersToMigrate.length > 0) {
    const result = await User.updateMany({ role: 'user' }, { $set: { role: 'customer' } });
    console.log(`Successfully migrated ${result.modifiedCount} users from 'user' to 'customer'`);
  } else {
    console.log('No users with legacy role found. Nothing to migrate.');
  }
  
  await mongoose.disconnect();
}

migrate().catch(console.error);
