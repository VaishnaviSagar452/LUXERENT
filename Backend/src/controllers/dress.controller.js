import { Dress } from "../models/dress.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const addDress = async (req, res) => {

  try {

    const {
      title,
      description,
      category,
      size,
      color,
      brand,
      rentPrice,
      securityDeposit
    } = req.body;

    if (
      [
        title,
        description,
        category,
        size,
        color,
        rentPrice
      ].some((field) => !field)
    ) {

      return res.status(400).json({
        message: "All required fields are mandatory"
      });
    }
    const imageLocalPath = req.file?.path;
    if (!imageLocalPath) {

  return res.status(400).json({

    message: "Dress image is required"
  });
}

const uploadedImage = await uploadOnCloudinary(
  imageLocalPath
);

    const dress = await Dress.create({

      title,
      description,
      category,
      size,
      color,
      brand,
      rentPrice,
      securityDeposit,

      owner: req.user?._id,

      images: uploadedImage
  ? [uploadedImage.secure_url]
  : [],
    });

    return res.status(201).json({

      message: "Dress added successfully",

      dress
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: error.message
    });
  }
};

const getAllDresses = async (req, res) => {

  try {

    const dresses = await Dress.find()
      .populate("owner", "fullname email")
      .sort({ createdAt: -1 });

    return res.status(200).json({

      message: "Dresses fetched successfully",

      dresses
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: error.message
    });
  }
};
const getSingleDress = async (req, res) => {

  try {

    const { id } = req.params;

    const dress = await Dress.findById(id)
      .populate("owner", "fullname email");

    if (!dress) {

      return res.status(404).json({
        message: "Dress not found"
      });
    }

    return res.status(200).json({

      message: "Dress fetched successfully",

      dress
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: error.message
    });
  }
};

const updateDress = async (req, res) => {

  try {

    const { id } = req.params;

    const updatedDress = await Dress.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true
      }
    );

    if (!updatedDress) {

      return res.status(404).json({
        message: "Dress not found"
      });
    }

    return res.status(200).json({

      message: "Dress updated successfully",

      updatedDress
    });

  } catch (error) {

    return res.status(500).json({
      message: error.message
    });
  }
};

const deleteDress = async (req, res) => {

  try {

    const { id } = req.params;

    const deletedDress = await Dress.findByIdAndDelete(id);

    if (!deletedDress) {

      return res.status(404).json({
        message: "Dress not found"
      });
    }

    return res.status(200).json({
      message: "Dress deleted successfully"
    });

  } catch (error) {

    return res.status(500).json({
      message: error.message
    });
  }
};
export {
  addDress,
  getAllDresses,
  getSingleDress,
  updateDress,
  deleteDress
};