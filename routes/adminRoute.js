const express = require("express");
const admin_route = express();
const bodyParser=require('body-parser')
const session=require('express-session')
const multer = require("multer");
const path = require('path')
const auth = require('../middleware/adminauth')

const config=('../config/config')
const adminController = require("../controllers/adminController")
const productController = require("../controllers/productController")
const orderController = require("../controllers/orderController")
const couponController = require("../controllers/couponController")
const excelController = require("../controllers/excelController")
const bannerController = require("../controllers/bannerController")
const offerController = require("../controllers/offerController")



admin_route.set('view engine','ejs')
admin_route.use(bodyParser.json())
admin_route.set('views','./view/admin');
admin_route.use(session({secret:config.sessionSecret}))
admin_route.use(express.static('public'))

// to store category image
const categoryStorage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname,'../public/adminassets/categoryImages'));
    },
    filename: function (req, file, cb) {
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    },
});
const uploadCategoryImage = multer({ storage: categoryStorage });

// to store product image
const ProductStorage = multer.diskStorage({
    destination: function (req, file, cb) {      
      cb(null, path.join(__dirname, '../public/adminassets/productImages'));
    },
    filename: function (req, file, cb) {
      const name = Date.now() + '_' + file.originalname;
      cb(null, name);
    },
  });
  
  // Create the Multer instance
  const ProductUpload = multer({
    storage: ProductStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
  });
  const upload = ProductUpload.array('image', 4);

  // to store banner image
  const bannerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/adminassets/bannerImages'));
    },
    filename: function (req, file, cb) {
      const name = Date.now() + '_' + file.originalname;
      cb(null, name);
    }
  });
  
  const bannerUpload = multer({ storage: bannerStorage });
  



  // routes
admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({extended:true}))

admin_route.post('/',adminController.verifyLogin)
admin_route.get('/',auth.isLogout,adminController.loadlogin)
admin_route.get('/admin',(req,res)=>{
    res.render('login')
})

admin_route.get('/login', adminController.loadAdminLogin)
admin_route.get('/home',auth.isLogin,adminController.loadhome)
admin_route.get('/dashboard',auth.isLogin,adminController.adminDasboard)

//userList
admin_route.get('/userlist',auth.isLogin,adminController.loaduser)
admin_route.get('/blockuser',auth.isLogin,adminController.blockuser)

//categories
admin_route.get('/categories',auth.isLogin,adminController.loadCategoryList)
admin_route.get("/addcategory", auth.isLogin, adminController.loadaddCategory)
admin_route.post('/categories',uploadCategoryImage.single('image'),adminController.categoryAdd)
admin_route.get('/editcategories',auth.isLogin, adminController.editCategoryLoad);
admin_route.post('/editcategories',uploadCategoryImage.single('image'), adminController.updatecategories);
admin_route.get('/blockcategories',auth.isLogin,adminController.blockcategories)


//products
admin_route.get('/productadd',auth.isLogin,productController.getCategories)
admin_route.get('/productlist',auth.isLogin,productController.loadProduct)
admin_route.post('/addproduct',ProductUpload.array('images', 4),productController.addProduct)
admin_route.get('/productedit',auth.isLogin,productController.getproductedit)
admin_route.get('/blockproducts',auth.isLogin,productController.blockProducts)
admin_route.post('/productedit',ProductUpload.array('images', 4),productController.updateproduct)
admin_route.get('/delete-products',auth.isLogin,productController.deleteproduct)


//orders
admin_route.get('/orderlist',auth.isLogin,orderController.getorders)
admin_route.get('/orderdetail',auth.isLogin,orderController.orderdetails)
admin_route.get('/orderstatus',auth.isLogin,orderController.setStatus)
admin_route.get('/blockorder',auth.isLogin,orderController.blockorder)


//coupons
admin_route.get('/getCoupon',auth.isLogin,couponController.viewCoupon)
admin_route.get('/getAddCoupon',auth.isLogin,couponController.getCoupon)
admin_route.post('/addCoupon',couponController.postAddCoupon)
admin_route.get('/couponDetail',auth.isLogin,couponController.couponDetail)
admin_route.get('/couponstatus',auth.isLogin,couponController.unlistcoupon)
admin_route.get('/couponedit',auth.isLogin,couponController.geteditcoupon)
admin_route.post('/editCoupon',couponController.editCoupon)

//sales report
admin_route.get('/salesReport',auth.isLogin,adminController.getSalesReport)
admin_route.get('/excelsalesreport',auth.isLogin,excelController.getExcelSalesReport)


//banner 
admin_route.get("/bannerList",auth.isLogin, bannerController.bannerList);
admin_route.get("/bannerAdd",auth.isLogin,bannerController.BannerAdd);
admin_route.post("/bannerAdd",bannerUpload.single("image"),bannerController.addBanner);
admin_route.get('/blockBanner',auth.isLogin,bannerController.blockBanner)
admin_route.get("/bannerEdit",auth.isLogin,bannerController.loadBannerEdit);
admin_route.post("/bannerEdit",bannerUpload.single("image"),bannerController.bannerEdit);

//offers
admin_route.get("/offerList",auth.isLogin,offerController.OfferList)
admin_route.get("/addOffer", auth.isLogin,offerController.loadOfferAdd)
admin_route.post("/addOffer", offerController.addOffer)
admin_route.get('/offerEdit',auth.isLogin,offerController.loadOfferEdit)
admin_route.post('/offerEdit',offerController.editOffer)
admin_route.get('/blockOffer',auth.isLogin,offerController.offerBlock)

//transaction
admin_route.get("/transactionList",auth.isLogin,orderController.transactionList)





//logout
admin_route.get('/logout',auth.isLogin,adminController.logout)

admin_route.get('*',function(req,res){
    res.redirect('/admin')
})



module.exports = admin_route

