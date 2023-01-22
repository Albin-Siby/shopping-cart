var express = require('express');
const fileUpload = require('express-fileupload');
var router = express.Router();
var productHelper = require('../modal/product-helper')

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
  //console.log(req.files.image)

  productHelper.addProduct(req.body, (id) => {
    console.log(id)
    let image = req.files.image
    let image2 = req.files.image2
    let image3 = req.files.image3
    image.mv('./public/product-images/'+id+"_1.jpg", (err) => {
      if(err) {
        console.log(err)
      }
    })

    image2.mv('./public/product-images/'+id+"_2.jpg", (err) => {
      if(err) {
        console.log(err)
      }
    })

    image3.mv('./public/product-images/'+id+"_3.jpg", (err) => {
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

router.get('/edit-product/:id', async(req,res) => {
  let proId = req.params.id
  await productHelper.getProductDetails(proId).then((product)=> {
    res.render('admin/edit-product', { product, admin: true })
  })
  
})

router.post('/edit-product/:id',fileUpload(), (req,res) => {
  let proId = req.params.id
  
  productHelper.updateProduct(proId, req.body).then(() => {
    res.redirect('/admin')
    if(req.files.image) {
      let image = req.files.image
      image.mv('./public/product-images/'+proId+'.jpg')
    }
  })
})

module.exports = router;
