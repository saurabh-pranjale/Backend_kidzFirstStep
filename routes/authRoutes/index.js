const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/auth');
const { authMiddleware } = require('../../middlewares/authMiddelware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);


router.post('/a',authMiddleware,(req,res)=>{
    
    console.log(req.user,"decoded")
})

module.exports = router;
