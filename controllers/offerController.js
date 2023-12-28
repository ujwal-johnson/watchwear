const Category = require('../models/categoriesModel')
const Product = require('../models/productModel')
const Offer = require('../models/offerModel')


// ! Offer list
const OfferList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        let query = {};
        const limit = 7;
        const totalCount = await Offer.countDocuments(query);

        const totalPages = Math.ceil(totalCount / limit);
        if (req.query.discountOn) {
            if (req.query.discountOn === "product") {
                query.discountOn = "product";
            } else if (req.query.discountOn === "category") {
                query.discountOn = "category";
            }
        }
        const offer = await Offer.find(query)
            .populate("discountedProduct")
            .populate("discountedCategory")
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ startDate: -1 });

        res.render("offerList", {
            offer,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        console.log(error.message);
    }
};

// to load add offer
const loadOfferAdd = async (req, res) => {
    try {
        const product = await Product.find().sort({ date: -1 });
        const category = await Category.find().sort({ date: -1 });
        res.render("offerAdd", { product, category });
    } catch (error) {
        console.log(error.message);
    }
};

// to add offer
const addOffer = async (req, res) => {
    try {
        const product = await Product.find({});
        const categoryData = await Category.find({});

        const {
            name,
            discountOn,
            discountType,
            discountValue,
            maxRedeemableAmt,
            startDate,
            endDate,
            discountedProduct,
            discountedCategory,
        } = req.body;

        const existingNameOffer = await Offer.findOne({ name });
        const existingCategoryOffer = await Offer.findOne({ discountedCategory });
        const existingProductOffer = await Offer.findOne({ discountedProduct });

        if (existingNameOffer) {
            return res.render("offerAdd", {
                product,
                category: categoryData,
                message: "Duplicate Discount Name not allowed.",
            });
        }

        if (discountedCategory && existingCategoryOffer) {
            return res.render("offerAdd", {
                product,
                category: categoryData,
                message: "An offer for this category already exists.",
            });
        }

        if (discountedProduct && existingProductOffer) {
            return res.render("offerAdd", {
                product,
                category: categoryData,
                message: "An offer for this product already exists.",
            });
        }

        const newOffer = new Offer({
            name,
            discountOn,
            discountType,
            discountValue,
            maxRedeemableAmt,
            startDate,
            endDate,
            discountedProduct,
            discountedCategory,
        });
        await newOffer.save();

        if (discountedProduct) {
            const discountedProductData = await Product.findById(discountedProduct);

            let discount = 0;
            if (discountType === "percentage") {
                discount = (discountedProductData.price * discountValue) / 100;
            } else if (discountType === "fixed Amount") {
                discount = discountValue;
            }
            await Product.updateOne(
                { _id: discountedProduct },
                {
                    $set: {
                        discountprice: calculateDiscountPrice(
                            discountedProductData.price,
                            discountType,
                            discountValue
                        ),
                        discount,
                        discountStart: startDate,
                        discountEnd: endDate,
                        discountStatus: true,
                    },
                }
            );
        } else if (discountedCategory) {
            const categoryData = await Category.findById(discountedCategory);

            await Category.updateOne(
                { _id: discountedCategory },
                {
                    $set: {
                        discountType,
                        discountValue,
                        discountStart: startDate,
                        discountEnd: endDate,
                        discountStatus: true,
                    },
                }
            );

            const discountedProductData = await Product.find({
                category: categoryData.category,
            });

            for (const product of discountedProductData) {
                let discount = 0;
                if (discountType === "percentage") {
                    discount = (product.price * discountValue) / 100;
                } else if (discountType === "fixed Amount") {
                    discount = discountValue;
                }
                await Product.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            discountprice: calculateDiscountPrice(
                                product.price,
                                discountType,
                                discountValue
                            ),
                            discount,
                            discountStart: startDate,
                            discountEnd: endDate,
                            discountStatus: true,
                        },
                    }
                );
            }
        }

        res.redirect("/admin/offerList");
    } catch (error) {
        console.error(error.message);
    }
};

// to calculate the discount price
function calculateDiscountPrice(originalPrice, discountType, discountValue) {
    if (discountType === "fixed Amount") {
        return originalPrice - discountValue;
    } else if (discountType === "percentage") {
        const discountAmount = (originalPrice * discountValue) / 100;
        return originalPrice - discountAmount;
    } else {
        throw new Error("Invalid discount type");
    }
}

// to load offer-edit page
const loadOfferEdit = async (req, res) => {
    try {
        const product = await Product.find().sort({ date: -1 });
        const category = await Category.find().sort({ date: -1 });
        const offerId = req.query.offerId;
        const admin = req.session.adminData;
        const offer = await Offer.findById(offerId)
            .populate("discountedProduct")
            .populate("discountedCategory");
        const startDate = new Date(offer.startDate).toISOString().split("T")[0];
        const endDate = new Date(offer.endDate).toISOString().split("T")[0];

        res.render("offerEdit", {
            admin,
            offer,
            product,
            category,
            startDate,
            endDate,
        });
    } catch (error) {
        console.log(error.message);
    }
};

// to post edit offers
const editOffer = async (req, res) => {
    try {
        const product = await Product.find({});
        const categoryData = await Category.find({});
        const {
            name,
            discountOn,
            discountType,
            discountValue,
            maxRedeemableAmt,
            startDate,
            endDate,
            discountedProduct,
            discountedCategory,
        } = req.body;
        const offerId = req.body.offerId;

        const existingOffer = await Offer.findById(offerId);

        if (!existingOffer) {
            return res.render("offerEdit", {
                message: "Offer not found.",
                product,
                category: categoryData,
            });
        }

        if (name !== existingOffer.name) {
            const existingNameOffer = await Offer.findOne({ name });
            if (existingNameOffer) {
                return res.render("offerEdit", {
                    product,
                    category: categoryData,
                    message: "Duplicate Discount Name not allowed.",
                });
            }
        }

        const categoryChanged = existingOffer.discountedCategory !== discountedCategory;
        const productChanged = existingOffer.discountedProduct !== discountedProduct;

        if (categoryChanged && existingOffer.discountedCategory) {
            await Category.updateOne(
                { _id: existingOffer.discountedCategory },
                { $set: { discountStatus: false } }
            );
            const discountedCategoryData = await Category.findById(existingOffer.discountedCategory);
            await Product.updateMany(
                { category: discountedCategoryData.category },
                { $set: { discountStatus: false } }
            );
        }

        if (productChanged && existingOffer.discountedProduct) {
            await Product.updateOne(
                { _id: existingOffer.discountedProduct },
                { $set: { discountStatus: false } }
            );
        }

        existingOffer.name = name;
        existingOffer.discountOn = discountOn;
        existingOffer.discountType = discountType;
        existingOffer.discountValue = discountValue;
        existingOffer.maxRedeemableAmt = maxRedeemableAmt;
        existingOffer.startDate = startDate;
        existingOffer.endDate = endDate;

        existingOffer.discountedProduct = discountedProduct;
        existingOffer.discountedCategory = discountedCategory;

        await existingOffer.save();

        if (discountedProduct) {
            const discountedProductData = await Product.findById(discountedProduct);

            let discount = 0;
            if (discountType === "percentage") {
                discount = (discountedProductData.price * discountValue) / 100;
            } else if (discountType === "fixed Amount") {
                discount = discountValue;
            }

            await Product.updateOne(
                { _id: discountedProduct },
                {
                    $set: {
                        discountprice: calculateDiscountPrice(
                            discountedProductData.price,
                            discountType,
                            discountValue
                        ),
                        discount,
                        discountStart: startDate,
                        discountEnd: endDate,
                        discountStatus: true,
                    },
                }
            );
        } else if (discountedCategory) {
            const categoryData = await Category.findById(discountedCategory);

            await Category.updateOne(
                { _id: discountedCategory },
                {
                    $set: {
                        discountType,
                        discountValue,
                        discountStart: startDate,
                        discountEnd: endDate,
                        discountStatus: true,
                    },
                }
            );

            const discountedProductData = await Product.find({
                category: categoryData.category,
            });

            for (const product of discountedProductData) {
                let discount = 0;
                if (discountType === "percentage") {
                    discount = (product.price * discountValue) / 100;
                } else if (discountType === "fixed Amount") {
                    discount = discountValue;
                }
                await Product.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            discountPrice: calculateDiscountPrice(
                                product.price,
                                discountType,
                                discountValue
                            ),
                            discount,
                            discountStart: startDate,
                            discountEnd: endDate,
                            discountStatus: true,
                        },
                    }
                );
            }
        }

        res.redirect("/admin/offerList");
    } catch (error) { }
};

// to block and unblock offer
const offerBlock = async (req, res) => {
    try {
        const id = req.query.offerId;
        const offer = await Offer.findById(id);

        offer.isActive = !offer.isActive;

        if (offer.discountedProduct) {
            const discountedProduct = await Product.findById(offer.discountedProduct);
            if (offer.isActive == false) {
                discountedProduct.discountprice = discountedProduct.price;
            } else {
                let discount = 0;
                if (offer.discountType === "percentage") {
                    discount = (discountedProduct.price * offer.discountValue) / 100;
                } else if (offer.discountType === "fixed Amount") {
                    discount = offer.discountValue;
                }
                discountedProduct.discountprice = calculateDiscountPrice(
                    discountedProduct.price,
                    offer.discountType,
                    offer.discountValue
                );
            }

            if (discountedProduct) {
                discountedProduct.discountStatus = offer.isActive;
                await discountedProduct.save();
            }
        } else if (offer.discountedCategory) {
            const discountedCategory = await Category.findById(
                offer.discountedCategory
            );
            const discountedProductData = await Product.find({
                category: discountedCategory.category,
            });

            if (discountedCategory) {
                discountedCategory.discountStatus = offer.isActive;
                await discountedCategory.save();
                const discountedProducts = await Product.updateMany(
                    { category: discountedCategory.category },
                    { $set: { discountStatus: offer.isActive } }
                );
            }
            for (const product of discountedProductData) {
                if (offer.isActive == false) {
                    product.discountprice = product.price;
                } else {
                    let discount = 0;
                    if (offer.discountType === "percentage") {
                        discount = (product.price * offer.discountValue) / 100;
                    } else if (offer.discountType === "fixed Amount") {
                        discount = offer.discountValue;
                    }
                    product.discountprice = calculateDiscountPrice(
                        product.price,
                        offer.discountType,
                        offer.discountValue
                    );
                }
                await product.save();
            }
        }

        await offer.save();
        res.redirect("/admin/offerList");
    } catch (error) {
        console.log(error);
    }
};


module.exports={
    OfferList,
    loadOfferAdd,
    addOffer,
    loadOfferEdit,
    editOffer,
    offerBlock
}