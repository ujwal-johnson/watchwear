const mongoose = require('mongoose');
const User = require('../models/userModel');
const UserOTPVerification = require('../models/userOTPModel')
const product = require('../models/productModel');
const Category = require("../models/categoriesModel");
const Cart = require('../models/cartModel');
const Address = require('../models/addressModel')
const Order = require('../models/orderModel');
const Banner = require('../models/bannerModel');
const Transaction = require("../models/transactionModel");
const Wishlist = require("../models/wishlistModel");

const { sendVarifyMail } = require("../helpers/services");


const Razorpay = require("razorpay");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randomstring =require('randomstring');
const validator = require('validator');

const razorpay = new Razorpay({
  key_id:"rzp_test_F4ZMIG928flEsU",
  key_secret:  "rmKyeTCnBOXJDLxpfd2wbWgb",
});

function generateOTP(length) {
    const characters = '0123456789'; 
    let otp = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      otp += characters[randomIndex];
    }
  
    return otp;
  }

  const loadOTPpage = async (req, res) => {
    const errorMessage = req.query.error;
    const user = req.user;
    req.session.user = user

    try {
        res.render('otpPage', { user, errorMessage });
    } catch (error) {
        console.log(error.message);
    }
};


  const loadHome = async (req, res) => {
    try {
      let query = { is_block: 0 }
      const currentDate = new Date();
      const categoryList = await Category.find({ is_listed: true });
      const productList = await product.find(query);
      console.log(productList);
      const banner = await Banner.find({        
        isListed: true
      }).populate("product");
      if (req.session.user_id) {
        const userData = req.session.user_id;
        res.render("homes", {
          User: userData,
          category: categoryList,
          products: productList,
          banner,
        });
      } else {
        res.render("homes", {
          category: categoryList,
          products: productList,
          banner,
          User: null,
        });
      }
    } catch (error) {
      console.log(error.message);
    }
  };

const loginload = async (req, res) => {
    try {
      let query = { is_block: 0 }
      const currentDate = new Date();
      const categoryList = await Category.find({ is_listed: true });
      const productList = await product.find(query);
      const banner = await Banner.find({        
        isListed: true
      }).populate("product");
      if (req.session.user_id) {
        const userData = req.session.user_id;
        res.render("homes", {
          User: userData,
          category: categoryList,
          products: productList,
          banner,
        });
      } else {
        res.render("homes", {
          category: categoryList,
          products: productList,
          banner,
          User: null,
        });
      }

    } catch (error) {
        console.log(error.message);
    }
}
const loginlog = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}

const userLogout = async(req,res)=>{
    try {
        delete req.session.user_id
        res.redirect('/');

    } catch (error) {
        console.log(error.message);
    }
}


const forgotpassword = async (req, res) => {
    try {
        res.render('forgotpassword');
    } catch (error) {
        console.log(error.message);
    }
}

const signupload = async (req, res) => {
    try {
        res.render('signup');
    } catch (error) {
        console.log(error.message);
    }
}

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

//to add new users
const insertUser = async (req, res) => {
    try {
      const existingUser = await User.findOne({ $or: [{ email: req.body.email }, { mobile: req.body.phone }] });

        if (existingUser) {
            // User with the same email or mobile already exists
            const errorMessage = 'Email or mobile number already exists';
            return res.render('signup', {  errorMessage: errorMessage });
        }
        console.log(req.body)
        const spassword = await securePassword(req.body.password);
        const user = new User({
            name: req.body.username,
            email: req.body.email,
            mobile: req.body.phone,
            password: spassword,
            is_admin:false,
        });
        console.log(user)

        const userData = await user.save();
        if (userData) {
            sendVerifyMail(req,req.body.username,req.body.email,userData._id);
            res.redirect('/otpPage')
        } else {
            return res.status(500).send('Registration failed');
        }
      
    } catch (error) {
        console.log(error.message);
       return res.status(500).send('An error occurred while registering.');
    }
};


const loadOtp = async (req, res) => {
    try {
      const otpGeneratedTime = req.session.otpGeneratedTime;

        res.render('otpPage', { otpGeneratedTime,error: null });
    } catch (error) {
        console.log(error.message);
    }
}

const foegetLoadotp = async (req, res) => {
  try {
    const otpGeneratedTime = req.session.otpGeneratedTime;

    res.render("forgetpassword-otp", { otpGeneratedTime });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);

    if (user) {
      const firstDigit = req.body.otp1;
      const secondDigit = req.body.otp2;
      const thirdDigit = req.body.otp3;
      const fourthDigit = req.body.otp4;
      
      const fullOTP = firstDigit + secondDigit + thirdDigit + fourthDigit;

      if (fullOTP === req.session.otp) {
        
        await User.updateOne({ _id: userId }, { newPassword: 'your_new_password' });

        // Clear relevant sessions
        delete req.session.otp;
        delete req.session.forgotPasswordOtpVerify;

        // Render the forgetpassword-change view
        res.redirect("/renewPassword");
            } else {
        // Render the EJS view with an error message for invalid OTP
        return res.render("forgetpassword-otp", {
          error: "Invalid OTP",
        });
      }
    } else {
      // Render the EJS view with an error message for user not found
      return res.render("otp-verification", {
        error: "User Not Found",
      });
    }
  } catch (error) {
    console.error(error.message);
    // Handle the error as needed
    return res.render("otp-verification", {
      error: "An error occurred during OTP verification",
    });
  }
};

//load reset password page

const loadResetPassword = async (req, res) => {
  try {
    if (req.session.userData) {
      const userId = req.session.user_id;
      const user = await User.findById(userId);

      res.render("forgetpassword-change", { User: user });
    } else {
      res.render("forgetpassword-change", { User: null });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// reset password

const resetPassword = async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const password = req.body.password;

    if (password.length < 8) {
      return res.render("renew-password", {
        message: "Password must be at least 8 characters long."
      });
    }
    const secure_password = await securePassword(password);
    const updatedData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password } }
    );
    if (req.session.user_id) {
      delete req.session.user_id;
      res.redirect("/login");
    } else {
      delete req.session.user_id;
      res.redirect("/renewPassword");
    }
  } catch (error) {
    console.log(error.message);
  }
};




const otpMatch = async (req, res) => {
    try {
        res.render('signup');
    } catch (error) {
        console.log(error.message);
    }
}

// for send mail
const sendVerifyMail = async(req,name,email,user_id)=>{

    try{
        console.log("email is send")
        const otp = generateOTP(4);
         req.session.otp=otp
        console.log(`Generated OTP: ${otp}`);

       const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:'watchwear4@gmail.com',
                pass:'hpmv hxrj qwfd ykln'
            }
        });

        const mailOptions ={
          from:'watchwear4@gmail.com',                
           to:email,
           subject:'For OTP verification ',
           text: `Your OTP: ${otp}`,
        }
        transporter.sendMail(mailOptions,function(error,info){
          if(error){
              console.log(error);
          }else{
              console.log("OTP has been sent:- ",info.response);
          }
        });
       
    }catch(error){
      console.log(error.message);
    }
    
  }


  //verify otp- checks if the entered otp is correct
  const verifyOTP = async (req, res) => {
    try {
        const userOTP = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;

        const storedOTP = req.session.otp;
        const products = await product.find({ is_listed: true });


        if (userOTP === storedOTP) {

            const userId = req.session.user_id;
            await User.updateOne({ _id:userId },{$set:{ is_verified:true} });
            
            delete req.session.otp;
            const user = await User.findById(userId);
            const banner = await Banner.find({        
              isListed: true
            }).populate("product");

            res.render('homes', { message: "OTP has been verified", User: user,banner,products  });

        } else {
        
            res.render('otpPage', { error: "Invalid OTP. Please try again." });

        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('An error occurred while verifying OTP.');
}
};

//to verify login and give user the acess
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        if (userData) {
            // Check if the user is not blocked (is_block is 0)
            if (userData.is_block === 0) {
                const passwordMatch = await bcrypt.compare(password, userData.password);

                if (passwordMatch) {
                    sendVerifyMail(userData.name, userData.email, userData._id, req);
                    req.session.user_id = userData._id;
                    res.redirect('/loadHome');
                } else {
                    res.render('login', { message: 'Email and password are incorrect' });
                }
            } else {
            
                res.render('login', { message: 'Access is blocked for this account' });
            }
        } else {
            res.render('home', { message: 'User not found' });
        }

    } catch (error) {
        console.log(error.message);
    }
};



//to generate otp and check it if its matching
const loginOtp = (req, res) => {
    try {
        const userOTP = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;

        const storedOTP = req.session.otp;

        if (userOTP === storedOTP) {
            const userId = req.session.user_id;
                 
                    delete req.session.otp;
                    res.redirect('/home')
            
      
        } else {
            res.render('otpPage', { message: "Invalid OTP. Please try again." });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('An error occurred while verifying OTP.');
}
};

const resendOTP = async (req, res) => {
    const email = req.body.email;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Generate and save a new OTP
      const newOTP = Math.floor(1000 + Math.random() * 9000); 
      await OTP.findOneAndUpdate({ user: user._id }, { otp: newOTP }, { upsert: true });
      return res.status(200).json({ message: 'OTP resent successfully.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  };

  // to forget password
  const forgetPassword = async (req, res) => {
    try {
      if (req.session.userData){
      const userId=req.session.user_id;
      const user = await User.findById(userId);

        res.render('forgotpassword',{ User: user });
      } else{
        res.render("forgotpassword", { User: null });

      }
    } catch (error) {
        console.log(error.message);
    }
}

//to load the otp page
const forgotPasswordOTP = async (req, res) => {
  try{
  const email = req.body.email;
    const userExist = await User.findOne({ email: email });

    if (userExist) {
      req.session.user_id = userExist._id;
      req.session.forgotPasswordOtpVerify = 1;

      console.log("this is user",userExist);
      sendVarifyMail(req, userExist.name, userExist.email);
      res.render('forgetpassword-otp', { message: "Otp sent to your mail" });
      console.log("this is forgetpassword-otp");
     } else {
      res.render("forgotpassword", { message: "Attempt Failed", User: null });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//forgot password otp verification 
const passwordOTPVerification = async (req, res) => {
  try {
      const userId = req.session.id3;
      const otp = req.body.fullOTP;
      console.log("this is full otp",otp);

      if (!otp) {
          const errorMessage = "Empty OTP details are not allowed";
          return res.redirect(`/otp-page?error=${errorMessage}`);
      } else {
          const userOTPVerificationRecords = await UserOTPVerification.find({
              userId
          });

          if (userOTPVerificationRecords.length <= 0) {
              const errorMessage = "Ivalid otp, Please request again";
              return res.redirect(`/otp-page?error=${errorMessage}`);
              console.log("the otp1 is empty");

          } else {
              const { expiresAt } = userOTPVerificationRecords[0];
              const hashedOTP = userOTPVerificationRecords[0].otp;

              if (expiresAt < Date.now()) {
                  await UserOTPVerification.deleteMany({ userId });
                  const errorMessage = "Code has expired. Please request again.";
                  return res.redirect(`/otp-page?error=${errorMessage}`);
                  console.log("the otp2 is empty");

              } else {
                  const validOTP = bcrypt.compare(otp, hashedOTP);

                  if (!validOTP) {
                      const errorMessage = "Invalid code passed. Check your inbox";
                      return res.redirect(`/otp-page?error=${errorMessage}`);
                      console.log("the otp3 is empty");

                  } else {


                      await UserOTPVerification.deleteMany({ userId });
                      res.render("forgetpassword-change")
                  }
              }
          }
      }
  } catch (error) {
      const errorMessage = "An error occurred during OTP verification";
      return res.redirect(`/otp-page?error=${errorMessage}`);
  }
};



// checking otp verification
// const forgetverifyOTP = async (req, res) => {
//   try {
//       const userOTP = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;

//       const storedOTP = req.session.otp;

//       if (userOTP === storedOTP) {

//           const userId = req.session.user_id;
//           await User.updateOne({ _id:userId },{$set:{ is_verified:true} });
          
//           delete req.session.otp;

//           res.render('changepassword', { message: "OTP has been verified" });
//       } else {
      
//           res.render('otpPage', { message: "Invalid OTP. Please try again." });
//       }
//   } catch (error) {
//       console.log(error.message);
//       return res.status(500).send('An error occurred while verifying OTP.');
// }
// };
const forgetverifyOTP = async(req,res)=>{
  try{
      const id = req.session.user_id;
      const userData = await User.findById(id);

      sendVerifyMail( req, userData.email);
      res.render('otppages',{userData})
      console.log(req.session.otp);
  }catch(error){
      console.log(error.message)
  }
 }


// to load productlist 
const loadproduct = async (req, res) => {
    try {
      const categories = await Category.find({ is_block: 0 });
      let query = { is_block: 0 }
      const search=req.query.search;
      if (search) {
        query.name = { $regex: new RegExp(search, "i") };
      }

      if(req.query.searchcategory){
        query.categories  = { $in: req.query.searchcategory };
      }

      if (req.query.categories) {
        query.categories =
          {
            $in: Array.isArray(req.query.categories)
              ? req.query.categories
              : [req.query.categories],
          } || "";
      }
      const totalProducts = await product.countDocuments(query);

       let sortQuery = {};

        if (req.query.sort) {
            if (req.query.sort === "1") {
                sortQuery = { price: 1 }; // Ascending order
            } else if (req.query.sort === "-1") {
                sortQuery = { price: -1 }; // Descending order
            } else {
                throw new Error("Invalid sort value");
            }
        }

      const selectedFilters = {
        search: search || "",
        category: req.query.categories || [],  
        sort: req.query.sort     
    };
  
      const products = await product.find(query).sort(sortQuery);
        res.render('productlist',{products,categories,selectedFilters,totalProducts})
       
    } catch (error) {
        console.log(error.message);
    }
}

// to load productdetail
const loadproductdetail = async (req, res) => {
    try {
        const productId = req.query.productId
        const products = await product.findById(productId)
        const categories = await Category.find();
        const successMessage = req.query.successMessage;

        res.render('productdetail',{products,categories,successMessage})
       
    } catch (error) {
        console.log(error.message);
    }
}




  
const forgotverifiy =async(req,res)=>{
    try{
      const userid = req.session.user_id;
      const password = req.body.password;
      const sPassword = await securePassword(password);
      const upadateData = await User.findByIdAndUpdate({_id:userid},{$set:{password:sPassword}});
       res.redirect('/newpassword');
    }catch(error){
        console.log(error.message);
}
}

const newpassword = async (req, res) => {
    try {
        res.render('newpassword');
    } catch (error) {
        console.log(error.message);
    }
}

// const addtocart = async (req, res) => {
//     try {
//         const userId = req.session.user_id;
//         const productId = req.query.productId;
//         const quantity = req.body.quantity;

//         // Validate if the product exists
//         const foundproduct = await product.findById(productId);
//         if (!foundproduct) {
//         return res.status(404).json({ message: 'Product not found' });
//         }

//         let userCart = await Cart.findOne({ user: userId });

//         if (!userCart) {
//             userCart = new Cart({ user: userId, items: [] });
//         }

//         // Check if the product exists in the cart
//         const existingItem = userCart.items.find(item => item.product.equals(productId));

//         if (existingItem) {
//             existingItem.quantity += quantity;
//         } else {
//             userCart.items.push({ product: productId, quantity });
//         }

//         // Calculate total price
//         userCart.total = userCart.items.reduce((total, item) => {
//             return total + item.quantity * product.price;
//         }, 0);

//         const savedCart = await userCart.save();
//         res.status(201).json({ message: 'Product added to cart successfully' });
//     } catch (error) {
//         console.error(error);
//         console.error('Error in addtocart controller:', error);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// };

const addtocart = async (req, res) => {
    try {
        const ProductId = req.query.productId;
        const userId = req.session.user_id;
        const { qty } = req.body;        
        console.log(userId)
        
        const existingCart = await Cart.findOne({ user: userId });
        let newCart = {};

        if (existingCart) {
            const existingCartItem = existingCart.items.find((item) => item.product.toString() === ProductId);

            if (existingCartItem) {
                existingCartItem.quantity += parseInt(qty);
            } else {
                existingCart.items.push({
                    product: ProductId,
                    quantity: parseInt(qty),
                });
            }

            existingCart.total = existingCart.items.reduce(
                (total, item) => total + (item.quantity || 0),
                0
            );

            await existingCart.save();

        } else {
            newCart = new Cart({
                user: userId,
                items: [{ product: ProductId, quantity: parseInt(qty) }],
                total: parseInt(qty, 10),
            });

            await newCart.save();
        }

        const userWishlist = await Wishlist.findOne({ user: userId });
        if (userWishlist) {
          const wishlistItemIndex = userWishlist.items.findIndex(
            (item) => item.product.toString() === ProductId
          );
          if (wishlistItemIndex !== -1) {
            userWishlist.items.splice(wishlistItemIndex, 1);
            await userWishlist.save();
          }
        }

        req.session.cartLength = (existingCart || newCart).items.length;

        const successMessage = 'Product added to cart successfully!';
        res.redirect(`/productdetail?productId=${ProductId}&successMessage=${encodeURIComponent(successMessage)}`)
        res.status(200).json({ success: true, message: 'Product added to cart' });

    } catch (error) {
        console.log(error)
    }
    }

    const addtocaddtocartfromwishlistart = async (req, res) => {
      try {
          const ProductId = req.query.productId;
          const userId = req.session.user_id;
          const { qty } = req.body;        
          console.log(userId)
          const existingCart = await Cart.findOne({ user: userId });
          let newCart = {};
  
          if (existingCart) {
              const existingCartItem = existingCart.items.find((item) => item.product.toString() === ProductId);
  
              if (existingCartItem) {
                  existingCartItem.quantity += parseInt(qty);
              } else {
                  existingCart.items.push({
                      product: ProductId,
                      quantity: parseInt(qty),
                  });
              }
  
              existingCart.total = existingCart.items.reduce(
                  (total, item) => total + (item.quantity || 0),
                  0
              );
  
              await existingCart.save();
  
          } else {
              newCart = new Cart({
                  user: userId,
                  items: [{ product: ProductId, quantity: parseInt(qty) }],
                  total: parseInt(qty, 10),
              });
  
              await newCart.save();
          }
  
          const userWishlist = await Wishlist.findOne({ user: userId });
          if (userWishlist) {
            const wishlistItemIndex = userWishlist.items.findIndex(
              (item) => item.product.toString() === ProductId
            );
            if (wishlistItemIndex !== -1) {
              userWishlist.items.splice(wishlistItemIndex, 1);
              await userWishlist.save();
            }
          }
  
          req.session.cartLength = (existingCart || newCart).items.length;
          // res.redirect(`/productdetail?productId=${ProductId}`)
          res.status(200).json({ success: true, message: 'Product added to cart' });
  
      } catch (error) {
          console.log(error)
      }
      }
    



const viewcart = async (req, res) => {
    try {
        const userid = req.session.user_id;
        const carts = await Cart.findOne({ user: userid }).populate('items.product').lean();

        const cart = carts ? carts.items : [];
        const subtotal = calculateSubtotal(cart);
        const productTotal = calculateProductTotal(cart);

        let outOfStockError = false;

        if (cart.length > 0) {
            for (const cartItem of cart) {
              const product = cartItem.product;
      
              if (product.quantity < cartItem.quantity) {
                outOfStockError = true;
                break;
              }
            }
          }
          let maxQuantityErr = false;
          if (cart.length > 0) {
            for (const cartItem of cart) {
              const product = cartItem.product;
      
              if (cartItem.quantity > 2) {
                maxQuantityErr = true;
                break;
              }
            }
          }
      
        res.render('cart', {
        carts: carts ? carts.items : [],
        User: userid,
        cart,
        productTotal,
        outOfStockError,
        maxQuantityErr,
        subtotal
  });
       
    } catch (error) {
        console.log(error.message);
    }
}

// to get user profile
const loaduser = async (req, res) => {
    try {
      const userid = req.session.user_id;
      const user = await User.findById(userid); 
      console.log(user)  
      const addresses = await Address.find();
        
      res.render('userprofile', { user,addresses});
    } catch (error) {
      console.error('Error fetching product data:', error);
    }
  };

  // to add address
  const addressadd = async (req, res) => {
    try {
        const addresses = await Address.find();  
     
        res.render('addressadd', { addresses });
      } catch (error) {
        console.error('Error fetching product data:', error);
        res.status(500).send('Internal Server Error');
      }
  };

           
  // updating quantity and subtotal
  const updateQuantityAndSubtotal = async (req, res) => {
      try {
          const { productId, newQuantity } = req.query;
          const userId = req.session.user_id;    
          const cart = await Cart.findOne({ user: userId });
  
          // Find the item in the cart
          const cartItem = cart.items.find(item => item.product.toString() === productId);
  
          if (cartItem) {
              // Update the quantity
              cartItem.quantity = parseInt(newQuantity);
              await cart.save();
  
              // Calculate the new subtotal
              const subtotal = cartItem.product.discountPrice * cartItem.quantity;
  
              res.json({ success: true, subtotal });
          } else {
              res.json({ success: false, error: 'Item not found in the cart' });
          }
      } catch (error) {
          console.error('Error updating quantity and subtotal:', error);
          res.json({ success: false, error: 'Failed to update quantity and subtotal' });
  }
  };

  // delete cart
  const deleteCart = async (req, res) => {
    const userId = req.session.user_id;
    const productId = req.params.productId;
  
    try {
        const userCart = await Cart.findOne({user: userId});
  
        if (!userCart) {
            return res.status(404).json({error: 'User cart not found.'});
        }
  
        const cartItemIndex = userCart.items.findIndex((item) =>
            item.product.equals(productId)
        );

        
  
        if (cartItemIndex === -1) {
            return res.status(404).json({error: 'Product not found in cart.'});
        }
  
        userCart.items.splice(cartItemIndex, 1);


         userCart.items.reduce(
        (total, item) => total - (item.quantity || 0),
        0)
        await userCart.save();
  
       
        res.redirect('/cart');
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ error: 'An error occurred while removing item from cart.' });
    }
  };

  // delete cart
  const deleteorder = async (req, res) => {
    const userId = req.session.user_id;
    const productId = req.params.productId;
  
    try {
        const userCart = await Cart.findOne({user: userId});
  
        if (!userCart) {
            return res.status(404).json({error: 'User cart not found.'});
        }
  
        const cartItemIndex = userCart.items.findIndex((item) =>
            item.product.equals(productId)
        );
   
       if (cartItemIndex === -1) {
            return res.status(404).json({error: 'Product not found in order detail.'});
        }
  
        userCart.items.splice(cartItemIndex, 1);


         userCart.items.reduce(
        (total, item) => total - (item.quantity || 0),
        0)
        await userCart.save();
  
       
        res.redirect('/orderdetail');
    } catch (error) {
        console.error('Error removing item from cart:', error);
    }
  };

  // to calculate total and subtotal in cart
  const calculateSubtotal = (cart) => {
    let subtotal = 0;
    for (const cartItem of cart) {
      subtotal += cartItem.product.price * cartItem.quantity;
    }
    return subtotal;
  };

  const calculateProductTotal = (cart) => {
    const productTotals = [];
    for (const cartItem of cart) {
        const total = cartItem.product.price * cartItem.quantity;
        productTotals.push(total);
    }
    return productTotals;
};

//Adding address
const addressAdd = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const street = req.body.street;
        const pinCODE = req.body.PINCODE;
        const city = req.body.city;
        const state = req.body.state;
        const country = req.body.country;


        const address = new Address({
            user: userId,
            street: street,
            pinCode: pinCODE,
            city:city,
            state: state,
            country: country,
            
        });

        const addressData = await address.save();

        if (addressData) {
            if (req.query.checkout) {
                res.redirect("/checkout");
              } else {
                res.redirect("/addresslist");
              }
        } else {
            res.render('your-error-view', { message: 'Address not added' });
        }
    } catch (error) {
        console.log(error.message);
    }
};
const Loadaddress = async (req, res) => {
    try {
        const id = req.query.addressId;
      const addressData = await Address.findOne({_id:id});
      
      if (addressData) {
        res.render('editaddress', {addresses:addressData});
      } 

    } catch (error) {
      console.log(error.message);
    }
  };

  const Loadprofile = async (req, res) => {
    try {
        const id = req.session.user_id;
      const userData = await User.findOne({_id:id});
      
      if (userData) {
        res.render('editprofile', {user:userData});
      } 

    } catch (error) {
      console.log(error.message);
    }
  };

//edit address
const editaddress = async (req, res) => {
    try {
        const id = req.body.addressesId;
        const addressData = await Address.findOne({_id:id});
        console.log(req.body);
        console.log(addressData);

        if (!addressData) {
            res.render('userprofile', { message: 'Address not found' });
            return;            
        } 
        if (req.method === 'POST') {
        if (req.body.street) {
            addressData.street = req.body.street;
        }
        if (req.body.PINCODE) {
            addressData.pinCode = req.body.PINCODE;
        }
        if (req.body.city) {
            addressData.city = req.body.city;
        }
        if (req.body.state) {
            addressData.state = req.body.state;
        }
        if (req.body.country) {
            addressData.country = req.body.country;
        }
        await addressData.save();
        res.redirect('/userprofile');
        }else {
            // Render the editaddress.ejs view and pass the addressData
            res.render('editaddress', { addressData });
        }
        } catch (error) {
        console.log(error.message);
    }
};

//edit profile
const editprofile = async (req, res) => {
    try {
        const id = req.session.user_id;
      const userData = await User.findOne({_id:id});
        console.log(userData);

        if (!userData) {
            res.render('userprofile', { message: 'Address not found' });
            return;            
        } 
          if (req.file) {
            userData.image = req.file.filename;
        }
        if (req.body.name) {
            userData.name = req.body.name;
        }
        if (req.body.email) {
            userData.email = req.body.email;
        }
        if (req.body.mobile) {
            userData.mobile = req.body.mobile;
        }
        await userData.save();
        res.redirect('/userprofile');
       
   
        } catch (error) {
        console.log(error.message);
    }
};



const getorders = async (req, res) => {
  try {
      const userId = req.session.user_id;
      const userData = req.session.user;

      const page = parseInt(req.query.page) || 1;
      const limit = 7; 

      const skip = (page - 1) * limit;

      const orderData = await Order.find({ user: userId })
          .populate('user')
          .populate({
              path: 'address',
              model: 'Address',
          })
          .populate({
              path: 'items.product',
              model: 'product',
          })
          .skip(skip)
          .sort({ orderDate: -1 })
          .limit(limit);

      const totalCount = await Order.countDocuments({ user: userId });

      const totalPages = Math.ceil(totalCount / limit);

      res.render('orderlist', { orders: orderData, user: userData, totalPages, currentPage: page });
  } catch (error) {
      console.error('Error fetching orders:', error);
  }
};


const listaddress = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const addresses = await Address.find({ user: userId });   
      res.render('addresslist', { addresses });
    } catch (error) {
      console.error('Error fetching product data:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  //upload profile image
  const updateProfileImage = async (req, res) => {
    try {
        const userId = req.session.user_id; 
        const user = await User.findById(userId);

        // Check if a new image is uploaded
        uploadUserImage(req, res, async (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('check controller');
            }

        // Update the user's profileImage field
            if (req.file) {
                user.profileImage = {
                    data: req.file.buffer,
                    contentType: req.file.mimetype,
                };
                await user.save();
            }

            res.redirect('/userprofile'); // Redirect to the user profile page
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error- catch');
    }
};

const loadcheckout = async (req, res) => {
    try {
        const userid = req.session.user_id;
        const carts = await Cart.findOne({ user: userid }).populate('items.product')

        const cartItems = carts ? carts.items : [];
        const subtotal = calculateSubtotal(cartItems);
        const productTotal = calculateProductTotal(cartItems);
        const outOfStockError = cartItems.some(item => item.quantity < item.quantity);
        const maxQuantityErr = cartItems.some(item => item.quantity > 2);
        const addresses = await Address.find({ user: req.session.user_id });
        const selectedAddress = req.body.selectedAddress;


        res.render('checkout', {
            carts:carts.items,
            User: userid,
            cart:cartItems,
            productTotal,
            subtotal,
            outOfStockError,
            maxQuantityErr,
            addresses,
            selectedAddress
      });
    } catch (error) {
        console.log(error.message);
    }
}
//select address on radiobutton in checkout
const displayCheckout = async (req, res) => {
    try {
        const addresses = await Address.find();
        const selectedAddress = req.body.selectedAddress;

        res.redirect('/ordersucess', {
            addresses,
            selectedAddress,
        });
    } catch (error) {
        console.log(error.message);
    }
};
const cashOnDelivery = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    const userId = req.session.user_id;
    const { address} = req.body;
  
    try {
      const user = await User.findById(userId);
      const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.product',
        model: 'product',
        })
  
      if (!user || !cart) {
        throw new Error('User or cart not found.');
      }
  
      const cartItems = cart.items || [];
      let totalAmount = 0;
  
      for (const cartItem of cartItems) {
        const product = cartItem.product;
  
        if (!product) {
          throw new Error('Product not found.');
        }
  
        if (product.quantity < cartItem.quantity) {
          throw new Error('Not enough quantity in stock.');
        }
        let couponResult = { error: '', discountedTotal: totalAmount };
  
            const isDiscounted = product.discountStatus &&
            new Date(product.startDate) <= new Date() &&
            new Date(product.endDate) >= new Date();
  
        const priceToConsider = isDiscounted ? product.discountPrice : product.price;
  
        product.quantity -= cartItem.quantity;
  
        const shippingCost = 100;
        const itemTotal = priceToConsider * cartItem.quantity + shippingCost;
        totalAmount += itemTotal;
  
        await product.save();
      } 
      const order = new Order({
        user: userId,
        address: address,
        orderDate: new Date(),
        status: 'Pending',
        paymentMethod: 'Cash on delivery',
        paymentStatus: 'Payment Pending',
        totalAmount: totalAmount,
        items: cartItems.map(cartItem => {
          const product = cartItem.product;
          const isDiscounted = product.discountStatus &&
            new Date(product.startDate) <= new Date() &&
            new Date(product.endDate) >= new Date();
          const priceToConsider = isDiscounted ? product.discountPrice : product.price;
      
          return {
            product: product._id,
            quantity: cartItem.quantity,
            price: priceToConsider,
          };
        }),
      });
      
  
      await order.save();
  
      await Cart.deleteOne({ user: userId });
  
      const orderItems = cartItems.map(cartItem => ({
        name: cartItem.product.name,
        quantity: cartItem.quantity,
        price: cartItem.product.discountPrice,
      }));
  
     
      await session.commitTransaction();
      session.endSession();
  
      res.redirect(`ordersucess?orderId=${order._id}`)
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

  //orders sucessfull
  const ordersucess = async (req, res) => {
    try {
     const userId = req.session.user_id;
     console.log(userId);

     const user = await User.findById(userId);
     const order = await Order.findOne({user:userId})
     .sort({ orderDate: -1 })
      .populate("user")
      .populate({
        path: "address",
        model: "Address",
      })
      .populate({
        path: "items.product",
        model: "product",
    }) 
    console.log(order);
    if (!order) {
      throw new Error('Order not found');
    }
    res.render('ordersucess', {user, order});
    } catch (error) {
      console.error('Error fetching product data:', error);
    }
  };
//   const ordersucess = async (req, res) => {
//     try {
//         const user = req.session.userData;
//         await Cart.deleteOne({ user: user._id }); // Fix variable name

//         const order = await Order.findOne({ user: user._id }) // Fix variable name
//             .populate("user")
//             .populate({
//                 path: "address",
//                 model: "Address",
//             })
//             .populate({
//                 path: "items.product",
//                 model: "product",
//             })
//             .sort({ orderDate: -1 });
//         if (
//             order.paymentMethod == "Online Payment" ||
//             order.paymentMethod == "Wallet"
//         ) {
//             order.paymentStatus = "Payment Successful";
//             await order.save();
//             if (order.paymentMethod == "Online Payment") {
//                 const transactiondebit = new Transaction({
//                     user: user._id,
//                     amount: order.totalAmount,
//                     type: "debit",
//                     paymentMethod: order.paymentMethod,
//                     orderId: order._id,
//                     description: `Paid using RazorPay `,
//                 });
//                 await transactiondebit.save();
//             }
//         }

//         res.render("ordersuccess", { order, User: user });
//     } catch (error) {
//         console.error("Error fetching order details:", error);
//     }
// };


  // to change password
  const changepassword = async(req,res)=>{
    try{
        const id = req.session.user_id;
        const userData = await User.findById(id);

        sendVerifyMail( req,userData.name, userData.email, userData._id);
        res.render('otppages',{userData})
        console.log(req.session.otp);
    }catch(error){
        console.log(error.message)
    }
   }

   const changeverify = async(req,res)=>{
    try{
        const verifiyotp = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;

        const storedotp = req.session.otp;
        if(verifiyotp === storedotp){
           const userId = req.session.user_id;     
           delete req.session.otp;
           res.redirect('/passchange');
           console.log("not  here");
        }
        else{
           res.render('otpPage',{error:'otp is incorrect'});
        }
    }catch(error){
        console.log(error.message);
        res.render('otpPage', { error: 'An error occurred during OTP verification' });
    }
   }

   const resetpassword = async(req,res)=>{
    try{
        res.render('changepassword');
    }catch(error){
        console.log(error.message);
    }
   }

   const resetverify = async(req,res)=>{
    try{
        const id = req.session.user_id;
        const password = req.body.password;
        const cpassword = req.body.spassword;

        // Validate passwords
        const errors = {};

        if (!validator.isLength(password, { min: 8 })) {
            errors.password = 'Password should be at least 8 characters.';
        }

        if (password !== cpassword) {
            errors.cpassword = 'Passwords do not match.';
        }

        if (Object.keys(errors).length > 0) {
            // If there are errors, render the form with error messages
            return res.render('your-form-view', { errors });
        }      
        const sPassword = await securePassword(password);
        const upadateData = await User.findByIdAndUpdate({_id:id},{$set:{password:sPassword}});
         res.redirect('/userprofile');
    }catch(error){
        console.log(error.message)
    }
   }

   //get order details in the admin side  
const OrderDetails = async (req, res) => {
    try {
      const userData = req.session.user_id
      const orderId = req.query.orderId;
  
      const orderData = await Order.findOne({ _id: orderId })
        .populate('user')
        .populate({
          path: 'address',
          model: 'Address',
        })
        .populate({
          path: 'items.product',
          model: 'product',
        })
        console.log(orderData);
      res.render('orderdetail', { order: orderData, user: userData });
  
    } catch (error) {
      console.error(error);
    }
  };

  //cancel order from order details
const cancelOrder = async (req, res) => {
    try {
      const orderId = req.query.orderId;
  
      let cancelledOrder = await Order.findById(orderId);
  
      if (!cancelledOrder) {
        return res.status(404).json({ error: 'Order not found.' });
      }
  
   if (cancelledOrder.paymentMethod === 'Cash on delivery') {
        cancelledOrder = await Order.findOne({ _id: orderId })
          .populate('user')
          .populate({
            path: 'items.product',
            model: 'product',
          });
  
        await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' }, { new: true });
  
        for (const item of cancelledOrder.items) {
          const product = item.product;
          product.quantity += item.quantity;
          await product.save();
        }
      }  
      res.redirect('/orderlist');
    } catch (error) {
      console.log("Error occurred", error);
    }
  };

  //return order by user if the order is delivered
// const returnOrder = async (req, res) => {
//     try {
//       const userId = req.session.user_id
//       const orderId = req.query.orderId;
//       const order = await Order.findByIdAndUpdate(orderId, { status: 'Return requested' }, { new: true });
//       if (!order) {
//         return res.status(404).json({ error: 'Order not found.' });
//       }
//       res.redirect('/orderlist')
//     } catch (error) {
//       console.log("Erorr while updating", error);
//     }
//   };
const returnOrder = async(req,res)=>{
  try{
    const orderId = req.query.orderId;

    
    const order = await Order.findOne({ _id: orderId })
      .populate("user")
      .populate({
        path: "items.product",
        model: "product",
      });

      if (!order) {
        return res.status(404).send("Order not found");
      }
      
      const user = order.user;
      user.walletBalance += order.totalAmount;
      await user.save();
      
    await order.save();

    for (const item of order.items) {
      const productId = item.product._id;
      const orderedQuantity = item.quantity;
      const Product = await product.findById(productId);

      if (Product) {
        Product.quantity += orderedQuantity;
        await Product.save();
      }
    }
    order.status = "Return Successfull";
    order.paymentStatus = "Refunded";
    await order.save();
    res.redirect('/orderlist')
  }catch(error){
    console.log(error.message);
}
}

  //load wallet page
const loadWallet = async (req, res) => {
  try {
      const userData = await User.findById({ _id: req.session.user_id })
      const transaction = await Transaction.find({ user: req.session.user_id, paymentMethod: "Wallet Payment" }).sort({ date: -1 });

      res.render('wallet', { user: userData, transaction: transaction});
  } catch (error) {
      console.log(error.message);
  }
};

const validatePassword = (password) => {
  // Add your password validation rules here
  const minLength = 8;
  const maxLength = 20;

  if (password.length < minLength || password.length > maxLength) {
      return { valid: false, message: `Password must be between ${minLength} and ${maxLength} characters.` };
  }

  // Add more rules as needed

  return { valid: true };
};


module.exports = {
    loadHome,
    loadOTPpage,
    loginlog,
    loginload,
    signupload,
    insertUser,
    loadOtp,
    foegetLoadotp,
    verifyOtp,
    sendVerifyMail,
    verifyOTP,
    verifyLogin,
    loginOtp,
    loadResetPassword,
    resetPassword,
    otpMatch,
    resendOTP,
    loadproduct,
    loadproductdetail,
    forgetPassword,
    forgotPasswordOTP,
    passwordOTPVerification,
    forgotverifiy,
    forgetverifyOTP,
    newpassword,
    userLogout,
    addtocart,
    addtocaddtocartfromwishlistart,
    viewcart,
    loaduser,
    updateQuantityAndSubtotal,
    deleteCart,
    calculateSubtotal,
    calculateProductTotal,
    addressAdd,
    listaddress,
    Loadaddress,
    editaddress,
    updateProfileImage,
    addressadd,
    loadcheckout,
    displayCheckout,
    cashOnDelivery,
    ordersucess,
    changepassword,
    changeverify,
    resetpassword,
    resetverify,
    getorders,
    Loadprofile,
    editprofile,
    OrderDetails,
    deleteorder,
    cancelOrder,
    returnOrder,
    loadWallet,
    validatePassword

};