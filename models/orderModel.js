const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
    default:null
  },
  status: {
    type: String,
    default: 'pending',
  },
  totalAmount : Number,
  paymentMethod:  {
    type: String,
    // enum: ['Cash on delivery', 'Online Payment', 'Wallet Payment'],
    // default: 'Cash on delivery',  
},
  paymentStatus: {
    type: String,
    // enum: ['Pending'],
  
}, 
  paymentTransactionId: String, 
  paymentDate: Date, 
  paymentAmount: Number, 
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
      },
      quantity: Number,
      price: Number,
      status: {
        type: String,
        default: 'pending', 
      },
    },
  ],
  is_block:{
    type:Number,
    default:0   
},
orderId:String,
});

module.exports = mongoose.model('Order', orderSchema);