const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },gender: { 
        type: String,
        enum: ['male', 'female'],
        required: true },
    image:{
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
    discountStatus:{
        type:Boolean,
        default:false
      },
      discount:String,
      discountStart:Date,
      discountEnd:Date,

});

module.exports = mongoose.model('Category', categorySchema);
