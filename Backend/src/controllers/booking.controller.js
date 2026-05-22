import { Booking } from "../models/booking.model.js";
import { Dress } from "../models/dress.model.js";

const createBooking = async (req, res) => {

  try {

    const {
      dressId,
      startDate,
      endDate
    } = req.body;

    if (
      !dressId ||
      !startDate ||
      !endDate
    ) {

      return res.status(400).json({
        message: "All fields required"
      });
    }

    const dress = await Dress.findById(dressId);

    if (!dress) {

      return res.status(404).json({
        message: "Dress not found"
      });
    }

    const existingBooking = await Booking.findOne({

      dress: dressId,

      bookingStatus: {
        $in: ["pending", "confirmed"]
      },

      $or: [

        {
          startDate: {
            $lte: endDate
          },

          endDate: {
            $gte: startDate
          }
        }
      ]
    });

    if (existingBooking) {

      return res.status(400).json({
        message: "Dress already booked for selected dates"
      });
    }

    const start = new Date(startDate);

    const end = new Date(endDate);

    const days =
      Math.ceil(
        (end - start) / (1000 * 60 * 60 * 24)
      ) + 1;

    const totalAmount =
      days * dress.rentPrice;

    const booking = await Booking.create({

      user: req.user?._id,

      dress: dressId,

      startDate,

      endDate,

      totalAmount
    });

    return res.status(201).json({

      message: "Booking created successfully",

      booking
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: error.message
    });
  }
};

const getMyBookings = async (req, res) => {

  try {

    const bookings = await Booking.find({

      user: req.user?._id

    })

    .populate("dress")

    .sort({ createdAt: -1 });

    return res.status(200).json({

      message: "Bookings fetched successfully",

      bookings
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: error.message
    });
  }
};

const cancelBooking = async (req, res) => {

  try {

    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {

      return res.status(404).json({
        message: "Booking not found"
      });
    }

    if (
      booking.user.toString()
      !==
      req.user?._id.toString()
    ) {

      return res.status(403).json({
        message: "Unauthorized"
      });
    }

    booking.bookingStatus = "cancelled";

    await booking.save();

    return res.status(200).json({

      message: "Booking cancelled successfully",

      booking
    });

  } catch (error) {

    return res.status(500).json({
      message: error.message
    });
  }
};

export {
  createBooking,
  getMyBookings,
  cancelBooking
};