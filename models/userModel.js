const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
 
    name:{
        type:String,
        required:true
    },
    image: {
        type: String,
        default: "users.jpg",
    },
    email:{
        type:String,
        required:true,
        unique: true
    },
    mobile:{
        type:String,
        required:true,
        unique: true
    },
   password:{
        type:String,
        required:true
    },
    is_admin:{
        type:Number,
        required:true
    },
    is_block:{
        type:Number,
        default:false     
    },
    token:{
        type:String,
        default:''
    },
     walletBalance: {
        type: Number,
        default: 0,
    }
    

});

module.exports = mongoose.model('User',userSchema);