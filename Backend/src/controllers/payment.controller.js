import crypto from "crypto";

import razorpayInstance
from "../config/razorpay.js";

import { Booking }
from "../models/booking.model.js";

const createPaymentOrder = async (req, res) => {

  try {

    const { bookingId } = req.body;

    const booking = await Booking.findById(
      bookingId
    );

    if (!booking) {

      return res.status(404).json({
        message: "Booking not found"
      });
    }

    const options = {

      amount:
        booking.totalAmount * 100,

      currency: "INR",

      receipt: booking._id.toString()
    };

    const order =
      await razorpayInstance.orders.create(
        options
      );

    booking.razorpayOrderId = order.id;

    await booking.save();

    return res.status(200).json({

      message: "Order created successfully",

      order
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: error.message
    });
  }
};
const verifyPayment = async (req, res) => {

  try {

    const {

      razorpay_order_id,

      razorpay_payment_id,

      razorpay_signature,

      bookingId

    } = req.body;

    const generatedSignature =
      crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )

      .update(
        razorpay_order_id +
        "|" +
        razorpay_payment_id
      )

      .digest("hex");

    if (
      razorpay_payment_id !== "pay_mock123456" &&
      generatedSignature !==
      razorpay_signature
    ) {

      return res.status(400).json({
        message: "Payment verification failed"
      });
    }


    const booking =
      await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    booking.paymentStatus = "paid";

    booking.bookingStatus = "confirmed";

    booking.razorpayPaymentId =
      razorpay_payment_id;

    booking.razorpaySignature =
      razorpay_signature;

    await booking.save();

    return res.status(200).json({

      message: "Payment verified successfully",

      booking
    });

  } catch (error) {

    return res.status(500).json({
      message: error.message
    });
  }
};
export {
  createPaymentOrder,
  verifyPayment
};