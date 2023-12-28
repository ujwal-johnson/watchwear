const User = require('../models/userModel');
const Coupon = require('../models/couponModel')

// get coupon list
const viewCoupon = async (req, res) => {
    try {
      const admin = req.session.adminData;
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
  
      const totalCouponsCount = await Coupon.countDocuments();
      const totalPages = Math.ceil(totalCouponsCount / limit);
      const skip = (page - 1) * limit;
  
      const coupons = await Coupon.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdDate: -1 })
  
      res.render('couponlist', { coupons, admin, totalPages, currentPage: page });
    } catch (err) {
      console.log("Error occurred while fetching coupons", err);
    
      res.status(500).send('Internal Server Error');
    }
  };

  //add coupon
const getCoupon = (req, res)=>{
    const admin=  req.session.adminData
      res.render('couponadd',{admin:admin})
    };

//function to add coupon on the admin side
const postAddCoupon = async (req, res) => {
    const admin = req.session.adminData;
    let { couponCode, discount, expiryDate, limit, DiscountType,maxRedeemableAmt,minCartAmt} = req.body;
    
    couponCode = couponCode.replace(/\s/g, '');
  
     
    try {
      if (!couponCode) {
        return res.render('couponadd', { message: "Coupon code cannot be empty", admin: admin });
      }
    const existingCoupon = await Coupon.findOne({ code: { $regex: new RegExp('^' + couponCode, 'i') } });
  
      if (existingCoupon) {
        return res.render('couponadd', { message: "Coupon code already exists", admin: admin });
      }

      // Validate flat amount discount against cart value
      if (DiscountType === 'fixed' && parseFloat(discount) > parseFloat(minCartAmt)) {
        return res.render('couponadd', { message: "Flat amount discount cannot be higher than cart value", admin: admin });
    }
  
      const newCoupon = new Coupon({
        code: couponCode,
        discount: discount,
        limit: limit,
        type: DiscountType,
        expiry: expiryDate,
        maxRedeemableAmt:maxRedeemableAmt,
        minCartAmt:minCartAmt
      });
  
      await newCoupon.save();
      res.redirect('/admin/getCoupon');
    } catch (err) {
      console.log("Error adding coupon", err);
      res.render('couponadd', { message: "Error adding coupon", admin: admin });
    }
  };

  //function to display coupon details on admin side  
 const couponDetail = async (req, res)=>{
    try{
      const admin=  req.session.adminData
      const couponId = req.query.couponId;
      const coupon = await Coupon.findById(couponId)
      .populate('usersUsed') 
      .sort({ _id: -1 })
      .exec();    
      const users = coupon.usersUsed;
      res.render('coupondetail', {users, coupon,admin:admin});
    }catch(err){
      console.log("Error finding the coupon code", err);
    } 
  };

  // to list and unlist coupon  
const unlistcoupon = async (req, res) => {
    try {
        const couponId = req.query.couponId;
        const action = req.query.action;
        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }

        // Update the isListed property based on the action
        coupon.isListed = action === 'list';

        // Save the updated coupon
        await coupon.save();
  
        res.redirect('/admin/getCoupon');
    } catch (error) {
        console.log(error.message);
  
  
    }
  };

  // get edit coupon page
    const geteditcoupon= async(req, res)=>{
    try {
      const admin=  req.session.adminData
      const { couponId } = req.query;
      const coupon = await Coupon.findOne({ _id: couponId });
      const endDate = new Date(coupon.expiry).toISOString().split('T')[0]
    
        res.render('couponedit',{admin:admin,coupon:coupon,endDate })
      
    } catch (error) {
      console.log(error.message);
      
    } 
    }

    //edit coupon
    const editCoupon = async (req, res) => {
    const admin = req.session.adminData;
    const { couponId } = req.query;
    const coupon = await Coupon.findOne({ _id: couponId });
    const endDate = new Date(coupon.expiry).toISOString().split('T')[0]
    try {
    
      let { couponCode, discount, expiryDate, limit, DiscountType,maxRedeemableAmt,minCartAmt } = req.body;
  
      couponCode = couponCode.trim();
  
      if (!couponCode) {
        return res.render('couponedit', { message: "Coupon code cannot be empty", admin ,coupon,endDate});
      }
  
      const existingCoupon = await Coupon.findOne({ _id: couponId });
  
      if (!existingCoupon) {
        return res.render('couponedit', { message: "Coupon not found", admin,coupon,endDate });
      }
  
      if (couponCode) {
        existingCoupon.code = couponCode;
      }
      if (discount) {
        existingCoupon.discount = discount;
      }
      if (expiryDate) {
        existingCoupon.expiry = expiryDate;
      }
      if (limit) {
        existingCoupon.limit = limit;
      }
      if (DiscountType) {
        existingCoupon.type = DiscountType;
      }
      if (maxRedeemableAmt) {
        existingCoupon.maxRedeemableAmt = maxRedeemableAmt;
      }
      if (minCartAmt) {
        existingCoupon.minCartAmt = minCartAmt;
      }  
  
      await existingCoupon.save();
      console.log("got here");
      res.redirect('/admin/getCoupon');
    } catch (err) {
      console.error("Error editing coupon", err);
    }
  };

  //function to get available coupon on the user side
  const getCoupons = async (req, res)=>{
    try {
      const currentDate = new Date();
      const User =  req.session.user_id 
  
      const coupon = await Coupon.find({
        expiry: { $gt: currentDate }, 
        limit: { $gt: 0 }, 
      }) .sort({ createdDate: -1 });
  
      res.render('couponlist', {coupon,User})
    } catch (error) {  
      console.error(error);
    }
  };

  

    module.exports={
        getCoupon,
        viewCoupon,
        postAddCoupon,
        couponDetail,
        unlistcoupon,
        geteditcoupon,
        editCoupon,
        getCoupons,
        
    }