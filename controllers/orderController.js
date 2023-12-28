const Category = require("../models/categoriesModel");
const product = require('../models/productModel');
const Order=require('../models/orderModel')
const Transaction = require("../models/transactionModel");
const bcrypt = require('bcrypt')
const express=require('express')
const app=express()
const randomstring =require('randomstring');

const getorders = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;

      const orders = await Order.find()
          .populate('user')
          .populate('address')
          .populate('items.product')
          .sort({ orderDate: -1 })
          .skip((page - 1) * limit)
          .limit(limit);
          

      const totalCount = await Order.countDocuments();
      const totalPages = Math.ceil(totalCount / limit);

      res.render('orderlist', {
          orders,
          totalPages,
          currentPage: page,
      });
  } catch (error) {
      console.error('Error fetching orders:', error);
  }
};

module.exports = {
  getorders,
};


  //show order details
  const orderdetails = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        console.log(orderId)
        const order = await Order.findById(orderId)
      .populate('user') 
      .populate('address')
      .populate('items.product');
      console.log(order);
      res.render('orderdetail',{order});
    } catch (error) {
      console.error('Error fetching orers:', error);
    }
  };

  //  change status in  the admin side
  const setStatus = async (req, res) => {
    try {
        const orderStatus = req.query.status;
        const orderId = req.query.orderId;
        console.log(orderId);
        console.log(orderStatus);
        const update = {
            $set: { status: orderStatus },
        };

        if (orderStatus === "Delivered") {
            update.$set.deliveryDate = Date.now();
            update.$set.paymentStatus = 'Payment Successful'
        } else if (orderStatus === "Cancelled" || orderStatus === "Return Confirmed") {
            const orderData = await Order.findOne({ _id: orderId })
                .populate('user')
                .populate({
                    path: 'items.product',
                    model: 'product',
                });

            console.log(orderData);

            const userData = await User.findOne({ _id: orderData.user._id });

            await userData.save();

            for (const item of orderData.items) {
                const product = item.product;
                product.quantity += item.quantity;
                await product.save();
            }
        }

        await Order.findByIdAndUpdate({ _id: orderId }, update);

        // Redirect after the update has been processed
        res.redirect('/admin/orderlist');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};

//blockorder
const blockorder = async (req, res) => {
  try {
      const orderId = req.query.orderId;
      console.log('Order ID:', orderId);

      const order = await Order.findById(orderId);
      console.log('Order before modification:', order);

      if (order) {
          order.is_block = !order.is_block; // Toggle the block status

          console.log('Order after modification:', order);
          await order.save();
          res.redirect('/admin/orderlist');
      } else {
          res.status(404).send('Order not found');
      }
  } catch (error) {
      console.error('Error toggling block status:', error);
  }
};


// Order Status Change

const changeOrderStatus = async (req, res) => {
  try {
    const OrderStatus = req.query.status;
    const orderId = req.query.orderId;
    const order = await Order.findById(orderId).populate({
      path: "items.product",
      model: "product",
    });

    if(OrderStatus =='Product Cancel'){
      const productId = req.query.productId
      for(const item of order.items){
        if(item.product._id==productId){
          item.status="Cancel Requested"
        }
      }
      await order.save();
      return res.redirect(`/orderdetail?orderId=${orderId}`)        
    }
    if (OrderStatus == "Cancelled") {
      for (const item of order.items) {
        const productId = item.product._id;
        const orderedQuantity = item.quantity;
        const product = await product.findById(productId);
        if (order.paymentMethod == "Cash On Delivery") {
          order.status = "Declined";
        } else {
          order.status == "Refunded";
        }
        if (product) {
          product.quantity += orderedQuantity;
          await product.save();
        }
      }
    }   
    await order.save();

    if (req.body.orderDetails) {
      res.redirect(`/orderdetail?orderId=${orderId}`);
    } else if (
      order.status == "Return Requested" ||
      order.status == "Cancel Requested"
    ) {
      res.redirect(`/orderdetail?orderId=${orderId}`);
    } else {
      res.redirect("/orderlist");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//to get transaction list
const transactionList = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      let query = {};
      if (req.query.type) {
          if (req.query.type === "debit") {
              query.type = "debit";
          } else if (req.query.type === "credit") {
              query.type = "credit";
          }
      }
      const limit = 5;
      const totalCount = await Transaction.countDocuments(query);

      const totalPages = Math.ceil(totalCount / limit);

      const transactions = await Transaction.aggregate([
          { $match: query },
          { $sort: { date: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
      ]);
      res.render("transactionList", {
          transactions,
          totalPages,
          currentPage: page,
      });
  } catch (error) {
      console.log(error.message);
  }
};
  
  









  module.exports={
    getorders,
    orderdetails,
    setStatus,
    blockorder,
    changeOrderStatus,
    transactionList
  }