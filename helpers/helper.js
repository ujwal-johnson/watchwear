const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

function generateOTP(length) {
  const characters = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    otp += characters[randomIndex];
  }

  return otp;
}

const calculateSubtotal = (cart) => {
  let subtotal = 0;
  for (const cartItem of cart) {
    const isDiscounted = cartItem.product.discountStatus &&
    new Date(cartItem.product.discountStart) <= new Date() &&
    new Date(cartItem.product.discountEnd) >= new Date();

const priceToConsider = isDiscounted ? cartItem.product.discountPrice : cartItem.product.price;

  subtotal += priceToConsider * cartItem.quantity;
}
  return subtotal;
};

const calculateProductTotal = (cart) => {
  const productTotals = [];
  for (const cartItem of cart) {
    const isDiscounted = cartItem.product.discountStatus &&
    new Date(cartItem.product.discountStart) <= new Date() &&
    new Date(cartItem.product.discountEnd) >= new Date();

const priceToConsider = isDiscounted ? cartItem.product.discountPrice : cartItem.product.price;

const total = priceToConsider * cartItem.quantity;    productTotals.push(total);
  }
  return productTotals;
};

function calculateDiscountedTotal(total, discountPercentage) {
  if (discountPercentage < 0 || discountPercentage > 100) {
    throw new Error('Discount percentage must be between 0 and 100.');
  }

  const discountAmount = (discountPercentage / 100) * total;
  const discountedTotal = total - discountAmount;

  return discountedTotal;
};



function calculateDiscountPrice(originalPrice, discountType, discountValue) {
  if (discountType === 'fixed Amount') {

    return originalPrice - discountValue;
  } else if (discountType === 'percentage') {

    const discountAmount = (originalPrice * discountValue) / 100;
    return originalPrice - discountAmount;
  } else {

    throw new Error('Invalid discount type');
  }
};







module.exports = {
  generateOTP,
  securePassword,
  calculateSubtotal,
  calculateProductTotal,
  calculateDiscountedTotal,
  calculateDiscountPrice
};