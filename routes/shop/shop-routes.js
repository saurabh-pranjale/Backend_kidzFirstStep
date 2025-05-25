const express=require('express')
const router=express.Router()
const {getFilterProducts,getProductDetails}=require('../../controllers/product/product-controller')

router.get('/get',getFilterProducts)
router.get('/get/:id',getProductDetails)

module.exports=router

