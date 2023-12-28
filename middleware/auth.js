const isLogin= async(req,res,next)=>{
    try{
        console.log(req.session.user_id);
        if(req.session.user_id){
    console.log("bye");
        }else{
         res.redirect('/login');
        }
        next();
    
    }catch(error){
        console.log(error.message);
    }
    
    }
    
    
    
    const isLogout= async(req,res,next)=>{
        try{
    console.log("hello");
            if(req.session.user_id){
               
                res.redirect('/loadhome');
            }else{
    
                next();
            }
        
        }catch(error){
            console.log(error.message);
        }
        
        }
    
    module.exports={
        isLogin,
        isLogout
    }