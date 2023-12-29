const express = require("express");
const user_route = express();
const controller=require('../controllers/userController')
const addressController = require('../controllers/addressController')
const bodyParser=require('body-parser')
const session=require('express-session')
const path = require('path')

const {isLogin,isLogout} = require("../middleware/auth")
const config=('../config/config')
user_route.set('views','./view/user');
const multer = require("multer");

const wishlistController = require("../controllers/wishlistController")
const couponController = require("../controllers/couponController")
const checkoutController= require("../controllers/checkoutController")
const orderController= require("../controllers/orderController")



// to store user image
const userStorage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname,'../public/adminassets/userImages'));
    },
    filename: function (req, file, cb) {
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    },
});
const uploadUserImage = multer({ storage: userStorage});


user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({extended:true}))

user_route.use(express.static('public'))
user_route.get('/',isLogout,controller.loadHome)

//login
user_route.get('/login',isLogout,controller.loginlog)
user_route.post('/login',controller.verifyLogin)
user_route.get('/loadhome',isLogin,controller.loadHome)
user_route.get('/otp-page', controller.loadOTPpage)
user_route.get("/otpEnter", controller.foegetLoadotp);
user_route.post("/otpEnter", controller.verifyOtp);
user_route.get("/renewPassword", controller.loadResetPassword);
user_route.post("/renewPassword", controller.resetPassword);



user_route.get('/loginOtp',controller.otpMatch);
user_route.post('/loginOtp',controller.loginOtp);
user_route.get('/home',isLogin,controller.loginload);

//signup
user_route.get('/signup',controller.signupload)
user_route.post('/signup',controller.insertUser)
user_route.get('/otpPage',controller.loadOtp)
user_route.post('/submitOTP',controller.verifyOTP)
user_route.post('/resendOTP', controller.resendOTP);

//forgotpassword
user_route.get('/forgotPassword', controller.forgetPassword);
user_route.post('/forgotpassword', controller.forgotPasswordOTP)
user_route.post('/passwordotpVerification', controller.passwordOTPVerification)


// product list and details
user_route.get('/productlist',isLogin,controller.loadproduct)
user_route.post('/productlist',controller.loadproduct)
user_route.get('/productdetail',isLogin,controller.loadproductdetail)

//cart
user_route.post('/addtocart',controller.addtocart)
user_route.get('/cart',isLogin,controller.viewcart)
user_route.put('/updateQuantityAndSubtotal',controller.updateQuantityAndSubtotal);
user_route.post('/removeItemFromCart/:productId',controller.deleteCart)

//wishlist
user_route.get('/wishlist',isLogin,wishlistController.getWishlist)
user_route.get('/addToWishlist',wishlistController.addToWishlist)
user_route.delete("/removeFromWishlist", wishlistController.removeFromWishlist);
user_route.post('/addToCartFromWishlist', wishlistController.addToCartFromWishlist)
user_route.post('/addtocartfromwishlists',controller.addtocaddtocartfromwishlistart)



//profile,address
user_route.get('/userprofile',isLogin,controller.loaduser);
user_route.post('/createaddress',controller.addressAdd)
user_route.get('/addressadd',isLogin,controller.addressadd);
user_route.get('/addresslist',isLogin,controller.listaddress);
user_route.get('/editaddress',isLogin,controller.Loadaddress)
user_route.post('/editaddress',controller.editaddress)
user_route.get('/orderlist',isLogin,controller.getorders)
user_route.get('/editprofile',isLogin,controller.Loadprofile)
user_route.post('/editprofile',uploadUserImage.single('image'),controller.editprofile)
user_route.get('/orderdetail',isLogin,controller.OrderDetails)
user_route.get('/cancelOrder',isLogin,controller.cancelOrder)
user_route.get('/returnOrder',isLogin,controller.returnOrder)
user_route.post('/removeItemFromorder/:productId',isLogin,controller.deleteorder)

//order details
user_route.get('/cancelSingleProduct',isLogin,orderController.changeOrderStatus);

//coupon
user_route.get('/getcoupon',isLogin,couponController.getCoupons);
user_route.get('/availableCoupons',isLogin,couponController.getCoupons)
user_route.post('/applyCoupon',checkoutController.applyCoupon)

//wallet
user_route.get('/getwallet',isLogin,controller.loadWallet)

//payments methods
user_route.post('/razorpayOrder',checkoutController.razorpayOrder)
user_route.post('/cashondelivery',checkoutController.cashOnDelivery)
user_route.post('/walletpayment',checkoutController.walletPayment)

//checkout
user_route.get('/checkout',isLogin,controller.loadcheckout)
user_route.post('/checkout', controller.displayCheckout);

// ordersucess
user_route.get('/ordersucess',isLogin,controller.ordersucess)

// change password
user_route.get('/changepassword',isLogin,controller.changepassword)
user_route.post('/changepassword',controller.changeverify);

user_route.get('/passchange',isLogin,controller.resetpassword)
user_route.post('/passchange',controller.resetverify);




//logout
user_route.get('/logout',isLogin,controller.userLogout)






module.exports = user_route;
