const product = require('../models/productModel');
const bcrypt = require('bcrypt')
const express=require('express')
const app=express()
const randomstring =require('randomstring');
const Category = require("../models/categoriesModel");



const loadProduct = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = 7;

      const products = await product.find()
          .skip((page - 1) * limit)
          .limit(limit);

      const totalCount = await product.countDocuments();
      const totalPages = Math.ceil(totalCount / limit);

      res.render('productlist', {
          products,
          totalPages,
          currentPage: page,
      });
  } catch (error) {
      console.error('Error fetching product data:', error);
      res.status(500).send('Internal Server Error');
  }
};

  const createproduct = async (req, res) => {
    const { name, description } = req.body;      
    try {
      const newProduct = new product({ name, description }); 
      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (error) {
      console.error('Error creating a product:', error);
      res.status(500).json({ error: 'Could not create product' });
    }
};

const loadProductadd = async (req, res) => {
    try {
        const products = await product.find();
        res.render('productadd', { products: products });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

  const insertProducts = async (req, res) => {
    try {
        const adminData = req.session.adminData;
        const title = req.body.name;
        const description = req.body.description;
        const color = req.body.color;
        const brand = req.body.brand;
        const quantity = req.body.quantity;        
        const categories = req.body.categories;        
        let image = "";

        if (req.file) {
            productImage = req.file.filename;
        }

        const existingProduct = await product.findOne({ name: title });

        if (existingProduct) {
            res.render("productadd", {
                error: "Product with the same name already exists",
                admin: adminData,
            });
        } else {
            const newproduct = new product({
                name: title,
                image: image,
                description: description,
                color: color,
                brand: brand,
                quantity :quantity,
                categories :categories,

                is_listed:true
            });

            const savedProduct = await newproduct.save();

            if (savedProduct) {
                return res.redirect("/admin/productadd");
            } else {
                return res.render("productadd", {
                    error: "Product cannot be added",
                    admin: adminData,
                });
            }
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const getCategories = async (req, res) => {
    try {
      const categories = await Category.find();
      console.log(categories)
      res.render('productadd', {categories});
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  const newproductLoad= async(req,res)=>{
    try {
        res.render('productadd')
    } catch (error) {
        console.log(error.message);
    }
}

  const addProduct = async (req, res) => {
    try {
      if (req.files) {
        for (let i = 1; i <= 4; i++) {
          const fieldName = `image${i}`;
  
          if (req.files[fieldName]) {
            const file = req.files[fieldName][0];
            const sharpImage = sharp(file.path);
  
            const metadata = await sharpImage.metadata();
            const width = metadata.width;
            const height = metadata.height;
  
            const aspectRatio = width / height;
  
            const targetSize = { width: 679, height: 679 };
  
            if (width > targetSize.width || height > targetSize.height) {
              sharpImage.resize({
                width: targetSize.width,
                height: targetSize.height,
                fit: "cover",
              });
            } else {
              sharpImage.resize(targetSize.width, targetSize.height);
            }
  
            const tempFilename = `${file.filename.replace(
              /\.\w+$/,
              ""
            )}_${Date.now()}.jpg`;
  
            const resizedImagePath = path.join(
              __dirname,
              "../public/productlist",
              tempFilename
            );
  
            await sharpImage.toFile(resizedImagePath);
  
            image.push(tempFilename);
          }
        }
      }

       console.log(req.body);
        const productName = req.body.name;
        const productQuantity = req.body.quantity;
        const productColor = req.body.product_color;
        const productSize = req.body.product_size;
        const productBrand = req.body.product_brand;
        const productDescription = req.body.description;
        const productPrice = req.body.product_price;
        const productcategories=req.body.categories;
        const productImages = req.files.map(file => file.filename);

        const Product = new product({
            name: productName,
            quantity: productQuantity,
            color: productColor,
            size: productSize,
            brand: productBrand,
            description: productDescription,
            price: productPrice,
            discountprice:productPrice,
            categories:productcategories,
            images: productImages
            
        });

        const savedProduct = await Product.save();

        if (savedProduct) {
            res.redirect('/admin/productlist'); 
        } else {
          const categories = await Category.find();

            res.render('productadd', {categories, message: "Something went wrong" });
        }
    } catch (error) {
        console.error(error.message);
    }
};

const getproductedit = async (req, res) => {
  try {
    const productId = req.query.productId;
    const products = await product.findById(productId)    
    const categories = await Category.find();
    if (!products) {
      return res.status(404).send('Product not found');
    }
    console.log(products)
    res.render('productedit', {products,categories,productId});
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Internal Server Error');
  }
};

const blockProducts = async (req, res) => {
  try {
      const productId = req.query.productId;
      const products = await product.findById(productId);

      if (products) {
          if (products.is_block === 0) {
              products.is_block = 1;
          } else if (products.is_block === 1) {
              products.is_block = 0;
          }
          await products.save();
          res.redirect('/admin/productlist');
      } else {
          res.status(404).send('Product not found');
      }
  } catch (error) {
      console.error('Error toggling block status:', error);
      res.status(500).send('Internal Server Error');
  }
};

// const insertProduct = async (req, res) => {
//   try {
//     const id = req.body.product_id;
//     const updateData = await product.findById(id);
//     if (!updateData) {
//       res.render("productedit", { error: "User not found" });
//     }

//     if (req.body.name) {
//       updateData.name = req.body.name;
//     }


//     const productName = req.body.name;
//     const productDescription = req.body.description;
//     const productImage = req.file ? req.file.filename : "";
//     const productQuantity = req.body.quantity;
//     const productColor = req.body.product_color;
//     const productSize = req.body.product_size;
//     const productBrand = req.body.product_brand;
//     const productPrice = req.body.product_price;
//     const productCategories = req.body.categories ; 

//     const existingProduct = await product.findOne({ name: productName });

//     if (existingProduct) {
//       res.render("productAdd", {
//         error: "Product with the same name already exists",
//         admin: adminData,
//       });
//     } else {
//       const products = new product({
//         name: productName,
//         description: productDescription,
//         image: productImage,
//         quantity: productQuantity,
//         color: productColor,
//         size: productSize,
//         brand: productBrand,
//         price: productPrice,
//         categories: productCategories,
//         is_listed: true,
//       });

//       const savedProduct = await products.save();

//       if (savedProduct) {
//         res.redirect('/admin/productlist');
//       } else {
//         res.render("productedit", {
//           error: "Product cannot be added",
//           admin: adminData,
//         });
//       }
//     }
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };
const updateproduct = async (req, res) => {
  try {
    const id = req.body.productId;
    console.log(req.body);
    console.log(id);

    const updatedProduct = await product.findByIdAndUpdate(
      id,
      {
        $set: {
          name: req.body.name,
          price: req.body.price,
          discountprice: req.body.price,
          description: req.body.description,
          brand: req.body.brand,
          color: req.body.color,
          quantity: req.body.quantity,
          categories: req.body.categories,
          size: req.body.product_size,
        },
      },
      { new: true } // Return the modified document
    );

    console.log(updatedProduct);

    if (req.files && req.files.length > 0) {
      updatedProduct.images[0] = req.files[0].filename;

    }

    await updatedProduct.save();

    res.redirect('/admin/productlist');
  } catch (error) {
    console.log(error);
  }
};


const deleteproduct = async(req,res)=>{
  try {
      const id = req.query.id
      await User.deleteOne({_id:id})
      res.redirect('/admin/productlist')
      
  } catch (error) {
      console.log(error.message);
  }
}








// const renderProductAddPage = async (req, res) => {
//     try {
//       const categories = await Category.find();
  
//       res.render('productadd', { categories });
//     } catch (error) {
//       console.error('Error fetching categories:', error);
//       res.status(500).send('Internal Server Error');
//     }
//   };

// const productaddload = async(req,res)=>{
//     try{
//         const categories = await category.find();
//         res.render('productadd', { categories });
//     }catch(error){
//         console.log(error.message);
// }
// }
  
   






  module.exports = {
    loadProduct,
    insertProducts,
    createproduct,
    loadProductadd,
    newproductLoad,
    addProduct,
    getCategories,
    getproductedit,
    blockProducts,
    deleteproduct,
    updateproduct
   
    
  }