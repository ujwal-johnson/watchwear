const express = require("express");
const product_route = express();
const bodyParser=require('body-parser')
const session=require('express-session')
const multer = require("multer");
const path = require('path')

const config=('../config/config')
const auth = require("../middleware/adminauth")
const productController = require("../controllers/productController")

product_route.set('view engine','ejs')
product_route.use(bodyParser.json())
product_route.set('views','./view/admin');
product_route.use(session({secret:config.sessionSecret}))
product_route.use(express.static('public'))



product_route.use(bodyParser.json())
product_route.use(bodyParser.urlencoded({extended:true}))

// go to admin route
