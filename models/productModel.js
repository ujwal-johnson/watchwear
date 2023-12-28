const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    
    name: {
        type: String,
        required: true
    },
    quantity:{
        type:Number,
        required:true
    },
    color:{
        type:String,
        required:true
    },
    brand: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price:{
        type:Number,
        required:true
    }, 
    discountprice:{
        type:Number,
        required:true
    },
    size:{
        type:String,
        required:true
    }, 
    images:{
        type:[String],
        required:true
    },
    categories:{
        type:String,
        required:true
    },   
    is_verified:{
        type:Number,
        default:0     
    },
    is_block:{
        type:Number,
        default:false   
    }, 
    discountStatus: {
        type: Boolean,
        default: false
      },
      discount: Number,
      discountStart: Date,
      discountEnd: Date,


});

module.exports = mongoose.model('product', productSchema);
