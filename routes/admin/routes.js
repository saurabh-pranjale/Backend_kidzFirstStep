const express = require('express')
const { getAllProducts, createProduct, getProductById } = require('../../controllers/admin/products')

const router = express.Router()



router.get('/',getAllProducts)

router.get('/:id',getProductById)

router.post('/add-product',createProduct)

router.put('/',()=>{
    console.log("hello")
})
router.patch('/',()=>{
    console.log("hello")
})
router.delete('/',()=>{
    console.log("hello")
})


module.exports = router