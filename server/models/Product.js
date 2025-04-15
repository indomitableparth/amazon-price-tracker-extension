// import mongoose from "mongoose";

// const productSchema = new mongoose.Schema({
//   name: String,
//   url: String,
//   imageUrl: String,
//   desiredPrice: Number,
//   currentPrice: Number,
//   email: String,
//   notified: { type: Boolean, default: false },
//   lastChecked: Date,
//   priceHistory: [  
//     {
//       price: Number,
//       checkedAt: Date,
//     }
//   ],
//   predictedDrop: { type: Boolean},
// });

// const Product = mongoose.model("Product", productSchema);

// export default Product; 


import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  imageUrl: {
    type: String,
    default: "https://via.placeholder.com/150",
  },
  desiredPrice: {
    type: Number,
    required: true,
  },
  currentPrice: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  notified: {
    type: Boolean,
    default: false,
  },
  lastChecked: {
    type: Date,
    default: Date.now,
  },
  priceHistory: [
    {
      price: Number,
      checkedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  predictedDrop: {
    type: Boolean,
    default: false,
  },
  saleAdvice: String,
});

const Product = mongoose.model("Product", productSchema);

export default Product;
