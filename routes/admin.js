var express = require('express');
const fileUpload = require('express-fileupload');
var router = express.Router();
var productHelper = require('../Helpers/product-helper')
var userHelper = require('../Helpers/user-helper')
const { check, validationResult } = require("express-validator");

const verifyLogin = (req,res,next) => {
  if(req.session.admin) {
    next()
  } else {
    res.redirect('admin/login')
  }
}

/* GET users listing. */
router.get('/', (req,res) => {
  if(req.session.admin) {
    productHelper.getAllProducts().then((products) => {
      res.render('admin/view-products', {admin: true, products, adm:req.session.admin});
    });
  } else {
    res.render('admin/login', { loginErr: req.session.loginErr || [], values: req.session.values || {}, admin: true })
  }
  
})

router.post('/',[
  check("Username").not().isEmpty().withMessage("Email is required"),
  check("Password").not().isEmpty().withMessage("Password is required")
], function(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    let allNull = true;
    if (errors.array().findIndex(error => error.param === "Username") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Password") === -1) {
      allNull = false;
    }
    if(allNull) {
      req.session.loginErr = [{ msg: "All fields are required" }];
      return res.redirect('/admin/');
      } else {
      req.session.values = req.body;
      req.session.loginErr = errors.array();
      return res.redirect('/admin/');
      }
    }

  productHelper.doLogin(req.body).then((response) => {
    if(response.status) {
      req.session.admin = response.admin
      req.session.admin.loggedIn = true
      res.redirect('/admin/')
    } else {
      let loginError = response.msg
      res.render('admin/login', { loginError, admin: true });
    }
  });
});

router.get('/admin',verifyLogin, (req,res,next) => {
  res.redirect('admin/view-products')
})

router.get('/logout', (req,res) => {
  req.session.admin.loggedIn = false
  req.session.admin = ""
  res.redirect('/admin/')
})

router.get('/add-products',verifyLogin, (req,res) => {
  res.render('admin/add-products', {admin: true, adm:req.session.admin})
})

router.get('/add-category',verifyLogin, (req,res) => {
  res.render('admin/add-category', {admin: true, adm:req.session.admin})
})

router.post('/add-products',fileUpload(),verifyLogin, (req,res) => {
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

router.post('/add-category', (req,res) => {
  //console.log(req.body)
  productHelper.addCategory(req.body).then((response) => {
    res.redirect('/admin/')
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
    res.render('admin/edit-product', { product, admin: true, adm:req.session.admin })
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

router.get('/allusers',verifyLogin, async(req,res) => {
  let users = await productHelper.getAllUsers()
  //console.log(users)
  res.render('admin/allusers', { users, admin: true, adm:req.session.admin })
})

router.get('/allcategories',verifyLogin, async(req,res) => {
  let categories = await productHelper.getAllCategory()
  res.render('admin/allcategories', { categories, admin: true, adm:req.session.admin })
})

router.get('/allorders',verifyLogin, async(req,res) => {
  let orders = await productHelper.getAllOrders()
  //console.log(orders)
  res.render('admin/allorders', {admin: true, orders, adm:req.session.admin })
})

router.get('/order-process/:id', async(req,res) => {
  let orderId = req.params.id
  let order = await productHelper.getOneOrder(orderId)
  let orderProducts = await userHelper.getOrderProducts(orderId)

  for (let i = 0; i < orderProducts.length; i++) {
    if (orderProducts[i].product.OfferPrice === '0') {
      orderProducts[i].product.OfferPrice = '';
    }
  }
  //console.log(orderProducts)
  //console.log(order)
  res.render('admin/order-process', { admin: true, order, orderProducts, adm:req.session.admin })
})

router.post('/order-process', (req,res) => {
  //console.log(req.body)
  let status = req.body.status
  let orderId = req.body.orderId
  productHelper.changeStatus(status,orderId).then((response) => {
    res.json(response)
  })
})

module.exports = router;