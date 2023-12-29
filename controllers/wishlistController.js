const product = require('../models/productModel');
const Cart = require('../models/cartModel'); 
const Wishlist=require('../models/wishlistModel')
const flash = require('express-flash');


//functon to load wishliat page
const getWishlist = async (req, res) => {
    req.session.lastGetRequest = req.originalUrl;
    const userId = req.session.user_id;

    try {
        const userWishlist = await Wishlist.findOne({ user: userId }).populate('items.product');

        const wishlist = userWishlist ? userWishlist.items : [];
      
        res.render('wishlist', { user: req.session.user, wishlist });
    } catch (err) {
        console.error('Error fetching user wishlist:', err);

    }
};

//funtion to add item to wishlist
const addToWishlist = async (req, res) => {
    const userId = req.session.user_id;
    const productId = req.query.productId;

    try {
        let userWishlist = await Wishlist.findOne({ user: userId });

        if (!userWishlist) {
            userWishlist = new Wishlist({
                user: userId,
                items: [{ product: productId }],
            });
        } else {
            const existingWishlistItem = userWishlist.items.find((item) => item.product.toString() === productId);

            if (existingWishlistItem) {
                res.redirect(`/productdetail?productId=${productId}`)
                return;
            } else {
                userWishlist.items.push({ product: productId });
            }
        }

        await userWishlist.save();

        const redirectUrl = req.session.lastGetRequest || '/wishlist'; 
        res.redirect(redirectUrl);
        } catch (error) {
        console.error('Error adding product to wishlist:', error);
    }
};

//add to cart from wishlist
const addToCart = async (req, res) => {
    const userId = req.session.user_id;
    const productId = req.query.productId;

    try {
        const userCart = await Cart.findOne({ user: userId }).populate('items.product');
        const userWishlist = await Wishlist.findOne({ user: userId }).populate('items.product');

        if (!userCart || !userWishlist) {     
            res.redirect('/wishlist');
            return;
        }

        const cartItem = userCart.items.find((item) => item.product.toString() === productId);
        const wishlistItemIndex = userWishlist.items.findIndex((item) => item.product.toString() === productId);

        if (cartItem) {
            res.redirect('/wishlist');
            return;
        }

        if (wishlistItemIndex !== -1) {
            const removedItem = userWishlist.items.splice(wishlistItemIndex, 1);
            userCart.items.push({ product: removedItem[0].product });

      
            await userCart.save();
            await userWishlist.save();
        }

        res.redirect(req.session.lastGetRequest);
    } catch (err) {
        console.error('Error adding item to cart from wishlist:', err);
     
    }
};

const removeFromWishlist = async (req, res) => {
    try {
      const userId = req.session.user_id;
      const productId = req.query.productId;
  
      const existingCart = await Wishlist.findOne({ user: userId });
      if (existingCart) {
        const updatedItems = existingCart.items.filter(
          (item) => item.product.toString() !== productId
        );
        console.log("this is the existing",existingCart);

        existingCart.items = updatedItems;
        await existingCart.save();
  
        res.json({ success: true });
      } else {
        res.json({ success: false, error: "Whishlist not found" });
      }
    } catch (error) {
      console.error("Error removing cart item:", error);
    }
  };

  const addToCartFromWishlist = async (req, res) => {
    const userId = req.session.user_id;
    const productId = req.body.productId;

    try {
        const userCart = await Cart.findOne({ user: userId }).populate('items.product');
        const userWishlist = await Wishlist.findOne({ user: userId }).populate('items.product');

        if (!userCart || !userWishlist) {
            res.redirect('/wishlist');
            return;
        }

        const cartItem = userCart.items.find((item) => item.product.toString() === productId);
        const wishlistItemIndex = userWishlist.items.findIndex((item) => item.product.toString() === productId);

        if (cartItem) {
            // If the item is already in the cart, just redirect to the wishlist
            res.redirect('/wishlist');
            return;
        }

        if (wishlistItemIndex !== -1) {
            // If the item is in the wishlist, remove it from the wishlist
            const removedItem = userWishlist.items.splice(wishlistItemIndex, 1);

            // Add the removed item to the cart
            userCart.items.push({ product: removedItem[0].product });

            // Save changes to both cart and wishlist
            await userCart.save();
            await userWishlist.save();

            res.json({ success: true });
        } else {
            // If the item is not in the wishlist, you might want to handle this case
            res.json({ success: false, error: 'Item not found in wishlist' });
        }
    } catch (err) {
        console.error('Error adding item to cart from wishlist:', err);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};






module.exports={
    addToWishlist,
    getWishlist,
    addToCart,
    removeFromWishlist,
    addToCartFromWishlist
}