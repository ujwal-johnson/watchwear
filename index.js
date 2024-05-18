const adminRoute = require('./routes/adminRoute');
const express= require('express')
const app= express()
const port =3001
const expressSession=require('express-session')
const userRoutes=require('./routes/userRoute')
const mongoose=require('mongoose')
const path=require('path')
const speakeasy= require('speakeasy')
const nodemailer=require('nodemailer')
const nocache= require('nocache') // for not going back

// mongoose.connect("mongodb://localhost:27017")

mongoose.connect("mongodb+srv://ujwaljo1422:ujwaljo1422@cluster0.d1ognsm.mongodb.net/")
mongoose.connection.on('connected',()=>{
    console.log('connected to MongoDB');
})

mongoose.connection.on('error',(err)=>{
    console.error('MongoDB connection error:'+err);
})
app.use(express.json());

// for not going back
app.use(nocache())

app.set('view engine','ejs')
app.use(express.static('public'))
app.set('views', path.join(__dirname, 'view'));



//otp
app.use(expressSession({
    secret: 'your-secret-key', // Change this to a secure secret key
    resave: false,
    saveUninitialized: true,
  }));
  
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());


  app.use(express.static('public'));
  app.use(express.urlencoded({extended:false}))
  
  
  //for admin routes
app.use(userRoutes)
app.use('/admin', adminRoute);

app.get('/error', (req, res) => {
    res.status(500).send('Internal Server Error'); 
});




app.listen(port,function(){
    console.log("server is running on http://localhost:"+port);
});