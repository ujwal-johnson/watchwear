const isLogin = async (req, res, next) => {
    try {
        if (req.session.adminId) {
            console.log("admin- in");

        } else {
            res.redirect('/admin');
        }
        next();

    } catch (error) {
        console.log(error.message);
    }

}



const isLogout = async (req, res, next) => {
    try {

        if (req.session.adminId) {
            res.redirect('/admin/dashboard');
            console.log("admin- out");
        }else{
            next();

        }
       

    } catch (error) {
        console.log(error.message);
    }

}

module.exports = {
    isLogin,
    isLogout
}