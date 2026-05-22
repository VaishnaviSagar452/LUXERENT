import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from './src/models/user.model.js';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const users = await User.find({});
  console.log(`Found ${users.length} users:`);
  users.forEach(u => {
    console.log({
      id: u._id,
      fullname: u.fullname,
      email: u.email,
      role: u.role,
      passwordLength: u.password?.length,
      passwordPrefix: u.password?.substring(0, 10),
      createdAt: u.createdAt
    });
  });
  
  await mongoose.disconnect();
}

check().catch(console.error);
