const User = require('../models/userModel');
const Category = require('../models/categoriesModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel')
const Address = require('../models/addressModel')
const Transaction = require("../models/transactionModel");

const mongoose = require('mongoose')
const Coupon = require('../models/couponModel')
const Razorpay = require('razorpay');
const {v4:uuidv4}=require('uuid')

const razorpay = new Razorpay({
    key_id:"rzp_test_F4ZMIG928flEsU",
    key_secret:  "rmKyeTCnBOXJDLxpfd2wbWgb",
  });

//function to place order using cashondelivery
const cashOnDelivery = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const userId = req.session.user_id;
    const { address, couponCode } = req.body;
  
    try {
      const user = await User.findById(userId);
      const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.product',
        model: 'product',
      });
  
      if (!user || !cart) {
        throw new Error('User or cart not found.');
      }
  
      const cartItems = cart.items || [];
      let totalAmount = 0;
      const subtotal = calculateSubtotal(cartItems);
      const subtotalWithShipping = subtotal + 100;
  
      for (const cartItem of cartItems) {
        const product = cartItem.product;
  
        if (!product) {
          throw new Error('Product not found.');
        }
  
        if (product.quantity < cartItem.quantity || product.quantity === 0) {
          throw new Error('Not enough quantity in stock.');

        }
        let couponResult = { error: '', discountedTotal: totalAmount };
  
        if (couponCode) {
          totalAmount = await applyCoup(couponCode, totalAmount, userId);
          if (couponResult.error) {
            return res.status(400).json({ error: couponResult.error });
          }
        }     
  
        const isDiscounted = product.discountStatus &&
            new Date(product.startDate) <= new Date() &&
            new Date(product.endDate) >= new Date();
  
        const priceToConsider = isDiscounted ? product.price : product.price;
  
        product.quantity -= cartItem.quantity;
  
        const shippingCost = 100;
        const itemTotal = priceToConsider * cartItem.quantity + shippingCost;
        totalAmount += itemTotal;
  
        await product.save();
      } 
      const order = new Order({
        orderId:uuidv4().split('-')[0].substring(0, 6),
        user: userId,
        address: address,
        orderDate: new Date(),
        status: 'Pending',
        paymentMethod: 'Cash on delivery',
        paymentStatus: 'Payment Pending',
        totalAmount: totalAmount,
        couponCode:couponCode,
        couponDiscount:subtotalWithShipping-totalAmount ,
        orginalPrice:subtotalWithShipping ,
        items: cartItems.map(cartItem => {
          const product = cartItem.product;
          const isDiscounted = product.discountStatus &&
            new Date(product.startDate) <= new Date() &&
            new Date(product.endDate) >= new Date();
          const priceToConsider = isDiscounted ? product.price : product.price;
      
          return {
            product: product._id,
            quantity: cartItem.quantity,
            price: priceToConsider,
          };
        }),
      });
      
  
      await order.save();

      console.log(couponCode,"order saved");
  
      await Cart.deleteOne({ user: userId });
  
      const orderItems = cartItems.map(cartItem => ({
        name: cartItem.product.name,
        quantity: cartItem.quantity,
        price: cartItem.product.price,
      }));
  
     
      await session.commitTransaction();
      session.endSession();
  
      res.status(200).json({ success: true, message: 'Order placed successfully.' });

    } catch (error) {
      console.error('Error placing the order:', error);
  
      await session.abortTransaction();
      session.endSession();
  
      let errorMessage = 'Error occurred while placing order.';
      if (error.message) {
        errorMessage = error.message;
      }
      return res.status(500).json({ success: false, message: errorMessage });

  
    }
  };

// to place order using walletpayment
const walletPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    const userId = req.session.user_id;
    const { address, couponCode } = req.body;
  
    try {
      const user = await User.findById(userId);
      const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.product',
        model: 'product',
      });
  
      if (!user || !cart) {
        throw new Error('User or cart not found.');
      }
  
      const cartItems = cart.items || [];
      if (cartItems.length === 0) {
        throw new Error('Cart is empty.');
      }
      const subtotal = calculateSubtotal(cartItems);
      const subtotalWithShipping = subtotal + 100;
      let totalAmount = 0;
      console.log(totalAmount,"no amount");
  
      if (couponCode) {
        totalAmount = await applyCoup(couponCode, totalAmount, userId);
      }
  
      if (user.walletBalance < totalAmount) {
        throw new Error('Insufficient funds in the wallet.');
      }
      for (const cartItem of cartItems) {
        const product = cartItem.product;
  
        if (!product) {
          throw new Error('Product not found.');
        }
  
        if (product.quantity < cartItem.quantity || product.quantity === 0) {
          throw new Error('Not enough quantity in stock.');
        }
  
        product.quantity -= cartItem.quantity;
  
        const shippingCost = 100;
        const itemTotal = product.price * cartItem.quantity + shippingCost;
        totalAmount += itemTotal;
  
        await product.save();
      }
  
      user.walletBalance -= totalAmount;
      await user.save();
  
      const order = new Order({
        orderId:uuidv4().split('-')[0].substring(0, 6),
        user: userId,
        address: address,
        orderDate: new Date(),
        status: 'Pending',
        paymentMethod: 'Wallet Payment',
        paymentStatus:'Payment Successful',
        totalAmount: totalAmount,
        couponCode:couponCode,
        couponDiscount:subtotalWithShipping-totalAmount ,
        orginalPrice:subtotalWithShipping ,
        items: cartItems.map(cartItem => ({
          product: cartItem.product._id,
          quantity: cartItem.quantity,
          price: cartItem.product.price,
        })),
      });
  
      await order.save();

      if (totalAmount <= user.walletBalance) {
        user.walletBalance -= totalAmount;
        await user.save();
        const transactiondebit = new Transaction({
          user: userId,
          amount : totalAmount,
          orderId:order._id,
          paymentMethod: 'Wallet Payment',
          type: 'debit', 
          description : `Debited from wallet for order : ${order._id}`
        });
        await transactiondebit.save();        
    } else {
        await order.deleteOne({ _id: orderData._id });
        return res
            .status(400)
            .json({ success: false, error: "Insufficient Wallet Balance", userData });
    }     
      
      await Cart.deleteOne({ user: userId });
  
      const orderItems = cartItems.map(cartItem => ({
        name: cartItem.product.name,
        quantity: cartItem.quantity,
        price: cartItem.product.price,
      }));
  
      const userEmail = user.email;
      const userName = user.username;
      const orderId = order._id;
      const ordertotalAmount = totalAmount;
    
  
      await session.commitTransaction();
      session.endSession();
      res.status(200).json({ success: true, message: 'Order placed successfully.' });
      } catch (error) {
      console.error('Error placing the order:', error);
  
      await session.abortTransaction();
      session.endSession();

      let errorMessage = 'Error occurred while placing order.';
      if (error.message) {
          errorMessage = error.message; 
      }  
      res.status(500).json({ success: false, message: errorMessage, error: error.message });

  }
  };

  // to place order using razorpay gateway
const razorpayOrder = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const { address, couponCode } = req.body;
  
      const user = await User.findById(userId);
      const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.product',
        model: 'product',
      });
  
      if (!user || !cart) {
        throw new Error('User or cart not found.');
      }
  
      const cartItems = cart.items || [];
      const subtotal = calculateSubtotal(cartItems);
      const subtotalWithShipping = subtotal + 100;
      let totalAmount = 0;

  
      for (const cartItem of cartItems) {
        const product = cartItem.product;
  
        if (!product) {
          throw new Error('Product not found.');
        }
  
        if (product.quantity < cartItem.quantity || product.quantity === 0) {
          throw new Error('Not enough quantity in stock.');
        }
  
        product.quantity -= cartItem.quantity;
  
        const shippingCost = 100;
        const itemTotal = product.price * cartItem.quantity + shippingCost;
        totalAmount += itemTotal;
        console.log(totalAmount,"not here ");
        await product.save();
      }
  
      if (couponCode) {
        totalAmount = await applyCoup(couponCode, totalAmount, userId);
      }
      totalAmount = parseInt(totalAmount)
      console.log(totalAmount+"Hello")
      const order = new Order({
        orderId:uuidv4().split('-')[0].substring(0, 6),
        user: userId,
        address: address,
        orderDate: new Date(),
        status: 'Pending',
        paymentMethod: 'Online Payment',
        paymentStatus: 'Payment Sucessfull',
        totalAmount: totalAmount,
        couponCode:couponCode,
        couponDiscount:subtotalWithShipping-totalAmount ,
        orginalPrice:subtotalWithShipping ,
        items: cartItems.map(cartItem => ({
          product: cartItem.product._id,
          quantity: cartItem.quantity,
          price: cartItem.product.discountPrice,
        })),
      });
  
      await order.save();
     
  
      const options = {
  
        amount: totalAmount*100,
        currency: 'INR',
        receipt: order._id,
      };
  
      razorpay.orders.create(options, async (err, razorpayOrder) => {
        if (err) {
          console.error('Error creating Razorpay order:', err);
        } else {          
          res.status(200).json({ message: 'Order placed successfully.', order: razorpayOrder });
        }
      });
    } catch (error) {
      console.error('Error placing the order:', error);
  
      await session.abortTransaction();
      session.endSession();
  
      let errorMessage = 'Error occurred while placing order.';
      if (error.message) {
          errorMessage = error.message;
      }
  
      return res.status(500).json({ success: false, message: errorMessage });
  }
  };

  // to apply coupon
const applyCoupon = async (req, res) => {
    try {
      const { couponCode } = req.body;
  
      const userId = req.session.user_id;
      const coupon = await Coupon.findOne({ code: couponCode });
      let errorMessage;
      
      if (!coupon) {
         errorMessage = "Coupon not found"
      }
      const currentDate = new Date();
      if ( currentDate > coupon.expiry) {
        errorMessage = "Coupon Expired"
      }
  
      if (coupon.usersUsed.length >= coupon.limit) {
        errorMessage = "Coupon limit Reached"
      }
  
      if (coupon.usersUsed.includes(userId)) {
        errorMessage = "You already used this coupon"
      }
      const cart = await Cart.findOne({ user: userId })
        .populate({
          path: 'items.product',
          model: 'product',
        })
        .exec();
      const cartItems = cart.items || [];
  
      const orderTotal = calculateSubtotal(cartItems);
      let discountedTotal = 0;
  
      // Additional condition to check if flat amount discount is higher than cart value
      if (coupon.type === 'fixed' && parseFloat(coupon.discount) > parseFloat(orderTotal)) {
        errorMessage = "Flat amount discount is higher than cart value";
    }

    if (!errorMessage) {
        if (coupon.type === 'percentage') {
            discountedTotal = calculateDiscountedTotal(orderTotal, coupon.discount);
        } else if (coupon.type === 'fixed') {
            discountedTotal = orderTotal - coupon.discount;
        }
    }
       res.json({ discountedTotal, errorMessage });
    } catch (error) {
      console.error('Error applying coupon: server', error);
      res.status(500).json({ error: 'An error occurred while applying the coupon.' });
    }
  };

  //calculate subtotal in cart
const calculateSubtotal = (cart) => {
    let subtotal = 0;
    for (const cartItem of cart) {
        const isDiscounted = cartItem.product.discountStatus &&
            new Date(cartItem.product.startDate) <= new Date() &&
            new Date(cartItem.product.endDate) >= new Date();
  
        // to use discountPrice if available and within the discount period, else use regular price
        const priceToConsider = isDiscounted ? cartItem.product.discountPrice : cartItem.product.price;
  
        subtotal += priceToConsider * cartItem.quantity;
    }
    return subtotal;
  };

  //calculate product total in cart
const calculateProductTotal = (cart) => {
    const productTotals = [];
    for (const cartItem of cart) {
        const isDiscounted = cartItem.product.discountStatus &&
            new Date(cartItem.product.startDate) <= new Date() &&
            new Date(cartItem.product.endDate) >= new Date();
  
        const priceToConsider = isDiscounted ? cartItem.product.discountPrice : cartItem.product.price;
  
        const total = priceToConsider * cartItem.quantity;
        productTotals.push(total);
    }
    return productTotals;
  };

  //function to apply coupon
async function applyCoup(couponCode, discountedTotal, userId) {
    const coupon = await Coupon.findOne({ code: couponCode })
    if (!coupon) {
      return { error: 'Coupon not found.' }
    }
    const currentDate = new Date();
    if (currentDate > coupon.expiry) {
      return { error: 'Coupon has expired.' }
    }
    if (coupon.usersUsed.length >= coupon.limit) {
      return { error: 'Coupon limit reached.' };
    }
  
    if (coupon.usersUsed.includes(userId)) {
      return { error: 'You have already used this coupon.' }
    }
    if (coupon.type === 'percentage') {
      discountedTotal = calculateDiscountedTotal(discountedTotal, coupon.discount);
    } else if (coupon.type === 'fixed') {
      discountedTotal = discountedTotal - coupon.discount;
    }
    coupon.limit--
    coupon.usersUsed.push(userId);
    await coupon.save();
    return discountedTotal;
  };

  //function to calulaate discount total
function calculateDiscountedTotal(total, discountPercentage) {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('Discount percentage must be between 0 and 100.');
    }
  
    const discountAmount = (discountPercentage / 100) * total;
    const discountedTotal = total - discountAmount;
  
    return discountedTotal;
  };
  
  module.exports={
    cashOnDelivery,
    walletPayment,
    razorpayOrder,
    applyCoupon
  }