import { User } from "../models/user.model.js";

const registerUser = async (req, res) => {

  try {
    console.log("REGISTER BODY:", req.body);
    const { fullname, email, password, role } = req.body;

    if (
      [fullname, email, password].some(
        (field) => !field || field.trim() === ""
      )
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const existedUser = await User.findOne({
      email
    });

    if (existedUser) {
      return res.status(409).json({
        message: "User already exists"
      });
    }

    const user = await User.create({
      fullname,
      email,
      password,
      role
    });

    return res.status(201).json({
      message: "User registered successfully",
      user
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: error.message
    });
  }
};

const loginUser = async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {

      return res.status(400).json({
        message: "Email and password required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {

      return res.status(404).json({
        message: "User not found"
      });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {

      return res.status(401).json({
        message: "Invalid password"
      });
    }

    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({

      message: "Login successful",

      accessToken,

      refreshToken,

      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: error.message
    });
  }
};

export { registerUser, loginUser };