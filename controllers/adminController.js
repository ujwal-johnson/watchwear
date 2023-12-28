const User = require("../models/userModel")
const Category = require('../models/categoriesModel');
const Order=require('../models/orderModel')
const Product = require('../models/productModel')
const chartData = require('../helpers/charDate')
const dateUtils = require("../helpers/dateUtil");
const sharp = require("sharp");

const bcrypt = require('bcrypt')
const express=require('express')
const app=express()
const randomstring =require('randomstring');


const securePassword = async(password)=>{
    try{

      const passwordHash = await  bcrypt.hash(password,10);
      return passwordHash;

    }catch(error){
    console.log(error.message);
    }
}
//for send mail
const addUserMail = async(name,email,password,user_id)=>{

    try{
        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.emailPassword
            }
        });
        const mailOptions = {
            from:config.emailUser,
            to:email,
            subject:'Admin add you and Verify your Mail',
            html:'<p> Hi '+name+', Please click here to <a href="http://127.0.0.1:3000/verify?id='+user_id+'"> verify </a> your mail.</p> <br><br><b>Email:-</b>'+email+'<br><b>Password:-</b>'+password+''
        }
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log("Email has been sent:-",info.response);
            }
        })

    }catch(error){
        console.log(error.message);
    }
}


const loadlogin = async(req,res)=>{
    try {
        res.render('login')
        
    } catch (error) {
        console.log(error.message);
    }
}
const loadhome = async(req,res)=>{
    try {
        const user = await User.find(); 
        res.render('productlist',{user})
        
    } catch (error) {
        console.log(error.message);
    }
}

//load admin loginpage
const loadAdminLogin = async (req, res) => {
  try {
    res.render('login')

  } catch (error) {
    console.log(error.message);

  }
};

const  verifyLogin = async(req,res)=>{
    try {
        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({email:email})
        if (userData) {

const passwordMatch = await bcrypt.compare(password,userData.password)
           if (passwordMatch) {
           if(userData.is_admin === 0){
            res.render('login',{message:"Email and password is incorrect"})
           }else{
            req.session.adminId = userData._id
            res.redirect("/admin/dashboard")
           }  

                
            } else {
            res.render('login',{message:"Email and password is incorrect"})
                
            }


        } else {
            res.render('login',{message:"Email and password is incorrect"})
        }


    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async(req,res)=>{
    try {
        const userData = await User.findById({_id:req.session.user_id})
        res.render('login',{admin:userData})
    } catch (error) {
        console.log(error.message);
    }
}


const logout =async(req,res)=>{
    try {
        req.session.destroy()

        res.redirect('/admin')
    } catch (error) {
        console.log(error.message);
    }
}

// const adminDasboard = async(req,res)=>{
//     try {
//     var search =''
//     if(req.query.search){
//         search=req.query.search
//     }

//     var page =1
//     if(req.query.page){
//         search=req.query.page
//     }
//     const limit = 2


//     const usersData = await User.find({
//         is_admin:0,
//         $or:[
//             {name:{$regex:'.*'+search+'.*',$options:'i'}},
//             {email:{$regex:'.*'+search+'.*',$options:'i'}},
//             {mobile:{$regex:'.*'+search+'.*',$options:'i'}}
//         ]
//     })
    
//     res.render('dashboard',{users:usersData})

//     } catch (error) {
//         console.log(error.message);
//     }
// }

//function to load admin dashboard
const adminDasboard = async (req, res) => {
    try { 
      const adminData = req.session.adminData;
        
      const [totalRevenue, totalUsers, totalOrders, totalProducts, totalCategories, orders, monthlyEarnings, newUsers] = await Promise.all([
        Order.aggregate([
          { $match: { paymentStatus: "Payment Successful" } },
          { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
        ]),
        User.countDocuments({ isBlocked: false, is_verified: true }),
        Order.countDocuments(),
        Product.countDocuments(),
        Category.countDocuments(),
        Order.find().limit(10).sort({ orderDate: -1 }).populate('user'),
        Order.aggregate([
          {
            $match: {
              paymentStatus: "Payment Successful",
              orderDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            },
          },
          { $group: { _id: null, monthlyAmount: { $sum: "$totalAmount" } } },
        ]),
        User.find({is_block:0 }).sort({date:-1}).limit(5)
      ]);
  
      const totalRevenueValue = totalRevenue.length > 0 ? totalRevenue[0].totalAmount : 0;
      const monthlyEarningsValue = monthlyEarnings.length > 0 ? monthlyEarnings[0].monthlyAmount : 0;
  
  
  
      // Get monthly data
      const monthlyDataArray = await chartData.getMonthlyDataArray();
  
      // Get daily data
      const dailyDataArray = await chartData.getDailyDataArray();
  
      // Get yearly data
      const yearlyDataArray = await chartData.getYearlyDataArray();
      console.log('Daily Orders for Last 7 Days:', dailyDataArray);

       

      res.render('dashboard', {
        admin: adminData,
        orders,
        newUsers,
        totalRevenue: totalRevenueValue,
        totalOrders,
        totalProducts,
        totalCategories,
        totalUsers,
        monthlyEarnings: monthlyEarningsValue,
        monthlyMonths: monthlyDataArray.map(item => item.month),
        monthlyOrderCounts: monthlyDataArray.map(item => item.count),
        dailyDays: dailyDataArray.map(item => item.day),
        dailyOrderCounts: dailyDataArray.map(item => item.count),
        yearlyYears: yearlyDataArray.map(item => item.year),
        yearlyOrderCounts: yearlyDataArray.map(item => item.count),
  
      });
    } catch (error) {
      console.log(error.message);
    }
  };

//add new users
const newUserLoad= async(req,res)=>{
    try {
        res.render('new-user')
    } catch (error) {
        console.log(error.message);
    }
}

const addUser = async(req,res)=>{
    try {
        const name = req.body.name
        const email = req.body.email
        const mno = req.body.mno
        const image = req.file.filename
        const password= randomstring.generate(8)
        const spassword = await securePassword(password)


        const user = new User({
            name:name,
            email:email,
            mobile:mno,
            image:image,
            password:spassword,
            is_verified:1,
            is_admin:0
        })

        const userData = await user.save()

        if (userData) {
            addUserMail(name,email,password,userData._id)
            res.redirect('/admin/dashboard')
        } else {
            res.render('new-user',{message:"Something wrong"})
            
        }


        
    } catch (error) {
        console.log(error.message);
    }
}
//edit user funcanctionality
 const editUserLoad= async(req,res)=>{
    try {
        const id= req.query.id
       const userData= await User.findById({_id:id})
       if (userData) {
        res.render('edit-user',{user:userData})        
       } else {
        res.redirect('/admin/dashboard')
       }
    } catch (error) {
        console.log(error.message);
    }
 }

 const updateUsers = async(req,res)=>{
    try {
      const userData = await User.findByIdAndUpdate({_id:req.body.id},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mno,is_verified:req.body.verify}})
        res.redirect('/admin/dashboard')
        } catch (error) {
        console.log(error.message);
    }
 }

 //delete users
 const deleteUser = async(req,res)=>{
    try {
        const id = req.query.id
        await User.deleteOne({_id:id})
        res.redirect('/admin/dashboard')
        
    } catch (error) {
        console.log(error.message);
    }
 }

 const loaduser = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;

      const totalCount = await User.countDocuments();
      const totalPages = Math.ceil(totalCount / limit);

      const users = await User.find()
          .skip((page - 1) * limit)
          .limit(limit);

      res.render('userlist', {
          users,
          totalPages,
          currentPage: page
      });
  } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).send('Internal Server Error');
  }
};


  // const blockUser = async (req, res) => {
  //   try {
  //     const id = req.query.userId;
  //     const userData = await User.findById(id);
  
  //     if (userData.is_block === false) {  
  //       userData.is_block = true;
  //       req.session.user_id = id
  
  //       if (req.session.user_id){
  //         delete req.session.user_id;
  //         log
  //       }
  //       delete req.session.userData; 
  //     } else {
  //       userData.is_block == false;
  //     }  
  //     await userData.save();
  //     res.redirect('/admin/userlist')
  //   } catch (error) {
  //     console.log(error.message);
  //   }
  // };

  // const blockuser=async (req, res) => {
  //   try {
  //       const userId = req.query.userId;
  //       const user = await User.findById(userId);
    
  //       if (user) {
  //         if (user.is_block === 0) {
  //           user.is_block = 1;
  //           delete req.session.user_id
  //         } else if (user.is_block === 1) {
  //           user.is_block = 0;
  //         }
  //         await user.save();
  //         res.redirect('/admin/userlist');
  //       } else {
  //         res.status(404).send('User not found');
  //       }
  //     } catch (error) {
  //       console.error('Error toggling block status:', error);
  //     }
  //   };
  //   app.post('/admin/blockuser', blockuser);
  const blockuser = async (req, res) => {
    try {
        const userId = req.query.userId;
        console.log('User ID:', userId);

        const user = await User.findById(userId);
        console.log('User before modification:', user);

        if (user) {
            if (user.is_block === 0) {
                  delete req.session.user_id;
                user.is_block = 1;
            } else if (user.is_block === 1) {
                user.is_block = 0;
            }

            console.log('User after modification:', user);
            await user.save();
            res.redirect('/admin/userlist');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error toggling block status:', error);
    }
};



const loadCategoryList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 7;

        const categories = await Category.find()
            .skip((page - 1) * limit)
            .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);

        res.render('categories', { categories,  totalPages, currentPage: page });
    } catch (error) {
        console.error(error.message);
    }
};


const loadaddCategory = (req, res)=>{
    const admin=  req.session.adminData
      res.render('categoriesAdd',{admin:admin})
    };

    
    const createCategory = async (req, res) => {
        const { name, description,image } = req.body;      
        try {
          const category = new Category({ name, description,image });
          await category.save();
          res.status(201).json(category);
        } catch (error) {
          console.error('Error creating a category:', error);
          res.status(500).json({ error: 'Could not create category' });
        }
      };

      const insertCategory = async (req, res) => {
        try {
          const adminData = req.session.adminData;
          const title = req.body.name;
          const description = req.body.description;
          let image = "";
          if (req.file) {
            image = req.file.filename;
          }
      
          const existingCategory = await Category.findOne({ name: title });
      
          if (existingCategory) {
            res.render("categoryAdd", {
              error: "Category with the same name already exists",
              admin: adminData,
            });
          } else {
            const category = new Category({
              name: title,
              image: image,
              description: description,
              is_listed:true
            });
      
            const userData = await category.save();
            res.redirect('/admin/categories');
      
          }
        } catch (error) {
          console.log(error.message);
        }
      };

      //Adding categories
      const categoryAdd = async (req, res) => {
        try {
            const name = req.body.name;
            const description = req.body.description;
            const image = req.file.filename;
            const gender = req.body.gender;
    
            const categoryExist = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    
            if (categoryExist) {
                res.render("categoriesAdd", {
                    error: "Category with the same name already exists",
                    admin: adminData,
                });
            } else {
                const category = new Category({
                    name: name,
                    description: description,
                    gender: gender,
                    image: image,
                });
    
                const categoryData = await category.save();
                res.redirect('/admin/categories');
            }
        } catch (error) {
            console.log(error.message);
            const categories = await loadCategoryList();
            res.render('categories', { categories, errorMessage: 'An error occurred while adding the category' });
        }
    };
    
    
      const editCategoryLoad = async (req, res) => {
        try {
          const categoryId = req.query.id;       
          const categoryData = await Category.findById(categoryId);
          
          if (categoryData) {
            res.render('editcategories', {categories:categoryData});
          } else {
            res.redirect('/admin/categories');
          }

        } catch (error) {
          console.log(error.message);
          res.status(500).send('Internal Server Error');
        }
      };
      
      const blockcategories=async (req, res) => {
        try {
            const categoriesId = req.query.categoriesId;
            const categories = await Category.findById(categoriesId);
        
            if (categories) {
              if (categories.is_block === 0) {
                categories.is_block = 1;
              } else if (categories.is_block === 1) {
                categories.is_block = 0;
              }
              await categories.save();
              res.redirect('/admin/categories');
            } else {
              res.status(404).send('cagtegory not found');
            }
          } catch (error) {
            console.error('Error toggling block status:', error);
          }
        };

        const updatecategories = async (req, res) => {
          try {
              const id = req.body.categoryId;
              const categoryData = await Category.findOne({ _id: id });
              console.log(req.body);
              console.log(categoryData);
      
              if (!categoryData) {
                  res.render('categories', { message: 'Category not found' });
                  return;
              }          
              if (req.body.name) {
                  categoryData.name = req.body.name;
              }
              if (req.body.description) {
                  categoryData.description = req.body.description;
              }
              if (req.file) {
                  categoryData.image = req.file.filename;
              }
              if (req.body.gender) {
                categoryData.gender = req.body.gender;
            }
      
              await categoryData.save();
      
              res.redirect('/admin/categories');
          } catch (error) {
              console.log(error.message);
              res.render('categories', { message: 'Error updating category' });
          }
      };

     //to get sales report page
     const getSalesReport = async (req, res) => {
      try {
          const admin = req.session.adminData;
          let query = { paymentStatus: { $in: ["Payment Sucessfull", "Payment Successful"] } };
  
          if (req.query.status) {
              if (req.query.status === "Daily") {
                  query.orderDate = dateUtils.getDailyDateRange();
              } else if (req.query.status === "Weekly") {
                  query.orderDate = dateUtils.getWeeklyDateRange();
              } else if (req.query.status === "Yearly") {
                  query.orderDate = dateUtils.getYearlyDateRange();
              }
          }
          if (req.query.startDate && req.query.endDate) {
              query.orderDate = {
                  $gte: new Date(req.query.startDate),
                  $lte: new Date(req.query.endDate),
              };
          }
  
          console.log(query);
  
          const page = parseInt(req.query.page) || 1;
          const limit = 7;
  
          const totalOrdersCount = await Order.countDocuments(query);
  
          const totalPages = Math.ceil(totalOrdersCount / limit);
  
          const orders = await Order.find(query)
              .populate("user")
              .populate({
                  path: "address",
                  model: "Address",
              })
              .populate({
                  path: "items.product",
                  model: "product",
              })
              .sort({ orderDate: -1 })
              .skip((page - 1) * limit)
              .limit(limit);
  
          // total revenue
          const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  
          // all returned orders
          const returnedOrders = orders.filter((order) => order.status === "Returned");
  
          const totalSales = orders.length;
  
          // total Sold Products
          const totalProductsSold = orders.reduce((acc, order) => acc + order.items.length, 0);
  
          res.render("salesReport", {
              orders,
              admin,
              totalRevenue,
              returnedOrders,
              totalSales,
              totalProductsSold,
              req,
              totalPages,
              currentPage: page,
          });
      } catch (error) {
          console.log(error.message);
      }
  };        
      

      
  
module.exports={
    loadlogin,
    loadhome,
    loadAdminLogin,
    verifyLogin,
    loadDashboard,
    logout,
    adminDasboard,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUsers,
    deleteUser,
    loaduser,
    blockuser,
    loadCategoryList,
    loadaddCategory,
    createCategory,
    insertCategory,
    editCategoryLoad,
    blockcategories,
    updatecategories,
    categoryAdd,
    getSalesReport
    }