import dotenv from "dotenv";

dotenv.config({
  path: "./.env"
});

import connectDB from "./config/db.js";
import app from "./app.js";

connectDB()
.then(() => {

  app.listen(process.env.PORT || 8000, () => {

    console.log(`Server running on PORT ${process.env.PORT}`);
  });

})
.catch((err) => {

  console.log("MongoDB connection error", err);
});