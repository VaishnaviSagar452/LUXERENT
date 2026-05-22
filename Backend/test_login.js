import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from './src/models/user.model.js';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const email = 'vaishnavi@gmail.com';
  console.log(`Finding user ${email}...`);
  const user = await User.findOne({ email });
  console.log('User found:', user);
  
  if (user) {
    console.log('Generating tokens...');
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    console.log('Tokens generated successfully!');
    
    // Test if we can save user
    user.refreshToken = refreshToken;
    console.log('Saving user with updated refreshToken...');
    await user.save({ validateBeforeSave: false });
    console.log('User saved successfully!');
  }
  
  await mongoose.disconnect();
}

test().catch(console.error);
