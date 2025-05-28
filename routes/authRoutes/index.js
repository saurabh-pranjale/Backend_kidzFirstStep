const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/auth');
const { authMiddleware } = require('../../middlewares/authMiddelware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

router.post("/logout", authController.logoutUser);


router.get('/check-auth',authMiddleware,(req,res)=>{

    const user = req.user
    
    res.status(200).json({success:true,user:user,message:"Authentication Successfull"})
})

module.exports = router;
