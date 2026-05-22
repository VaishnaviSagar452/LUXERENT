import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(

  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    dress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dress",
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    totalAmount: {
      type: Number,
      required: true
    },

    bookingStatus: {
      type: String,

      enum: [
        "pending",
        "confirmed",
        "cancelled",
        "completed"
      ],

      default: "pending"
    },

    paymentStatus: {
      type: String,

      enum: [
        "pending",
        "paid",
        "failed"
      ],

      default: "pending"
    },
    razorpayOrderId: {
  type: String
},

razorpayPaymentId: {
  type: String
},

razorpaySignature: {
  type: String
},

  },

  {
    timestamps: true
  }
);

export const Booking = mongoose.model(
  "Booking",
  bookingSchema
);