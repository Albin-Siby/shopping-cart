var express = require('express');
const fileUpload = require('express-fileupload');
var router = express.Router();
var productHelper = require('../helpers/product-helper')

/* GET users listing. */
router.get('/', function(req, res, next) {

  productHelper.getAllProducts().then((products) => {
    res.render('admin/view-products', {admin: true, products})
  })

});

router.get('/add-products', (req,res) => {
  res.render('admin/add-products', {admin: true})
})

router.post('/add-products',fileUpload(), (req,res) => {
  // console.log(req.body)
  // console.log(req.files.image)

  productHelper.addProduct(req.body, (id) => {
    console.log(id)
    let image = req.files.image
    image.mv('./public/product-images/'+id+".jpg", (err) => {
      if(!err) {
        res.render('admin/add-products', {admin: true})
      } else {
        console.log(err)
      }
    })
    
  })
})

router.get('/delete-product/:id', (req,res) => {
  let prodId = req.params.id
  productHelper.deleteProduct(prodId).then((data) => {
    res.redirect('/admin/')
  })
})

module.exports = router;
