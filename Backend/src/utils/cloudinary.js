import cloudinary from "../config/cloudinary.js";

const uploadOnCloudinary = async (localFilePath) => {

  try {

    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: "auto"
      }
    );

    return response;

  } catch (error) {

    console.log(error);

    return null;
  }
};

export { uploadOnCloudinary };