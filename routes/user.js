var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helper')
var userHelper = require('../helpers/user-helper')

const verifyLogin = (req,res,next) => {
  if(req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user = req.session.user
  //console.log(user)
  let productCount = null
  let usercart
  
  if(req.session.user) {
    productCount =await userHelper.getCartProductCount(req.session.user._id)
    
  }

  productHelper.getAllProducts().then((products) => {
    let offerProducts = [];
    let normalProducts = [];
    products.forEach(product => {
      if(product.OfferPrice === '') {
        normalProducts.push(product);
      } else {
        offerProducts.push(product);
      }
    });
    console.log(offerProducts)
    res.render('./user/view-products', { normalProducts, offerProducts, user, productCount, usercart: false });
  })

});

router.get('/show-product/:id', async(req,res) => {
  let proId = req.params.id                                
  let oneProduct =await productHelper.getProductDetails(proId)
  console.log(oneProduct)
  res.render('user/show-product', { oneProduct, admin: false })
})

router.get('/signup', (req,res) => {
  res.render('user/signup')
})

router.get('/login', (req,res) => {
  if(req.session.loggedIn){
    res.redirect('/')
  } else{
    res.render('user/login', { loginerr: req.session.loginErr })
    req.session.loginErr = false
  }
})

router.post('/signup', (req,res) => {
  userHelper.doSignup(req.body).then((userData) => {
    //console.log(userData)
    req.session.loggedIn = true
    req.session.user = userData
    res.redirect('/')
  })
})

router.post('/login', (req,res) => {
  userHelper.doLogin(req.body).then((respond) => {
    if(respond.Status) {
      req.session.loggedIn= true;
      req.session.user = respond.user;
      res.redirect('/')
    } else {
      req.session.loginErr = true
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req,res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin, async(req,res) => {
  let cartCount = null
  let usercart
  
  if(req.session.user) {
    cartCount =await userHelper.getCartCount(req.session.user._id)
    
  }

  let products = await userHelper.getCartProducts(req.session.user._id)
    //console.log(products)
    if(products && products.length > 0){
      let total = await userHelper.getTotalAmount(req.session.user._id,products)
      res.render('user/cart', { products, total, user:req.session.user, cartCount, usercart:true })
    } else {
      res.render('user/cart', { products, user:req.session.user, cartCount, usercart:true })
    }
  
})

router.get('/add-to-cart/:id', (req,res) => {
  let proId = req.params.id
  userHelper.addToCart(proId,req.session.user._id).then(() => {
  //res.redirect('/')
  res.json({status: true})
  })
  
})

router.post("/change-product-quantity", (req,res,next) => {
  //console.log(req.body)
  userHelper.changeProductQuantity(req.body).then(async(response) => {
    response.total = await userHelper.getTotalAmount(req.body.user) 
    res.json(response)
  })
})

router.delete('/delete-cart-product', (req,res,next) => {
  userHelper.deleteProduct(req.body).then((response) => {
    res.json(response)
  })
})

router.get("/checkout",verifyLogin, async(req,res) => {
  let cartCount = null
  let usercart
 
  if(req.session.user) {
    cartCount =await userHelper.getCartCount(req.session.user._id)
    
  }
  let products = await userHelper.getCartProducts(req.session.user._id)
  //console.log(products)
  // let selectedAddress = await userHelper.getOneAddress(addressId)
  let total = await userHelper.getTotalAmount(req.session.user._id)
  userHelper.getAddress().then((allAddress) => {
    //console.log(allAddress)
    res.render("user/checkout",{user:req.session.user, total, cartCount, products, usercart: true, allAddress})
  })
    
})

router.get('/add-address',verifyLogin, async(req,res) => {
  let cartCount = null
  let usercart
  
  
  if(req.session.user) {
    cartCount =await userHelper.getCartCount(req.session.user._id)
    
  }
  let products = await userHelper.getCartProducts(req.session.user._id)
  let total = await userHelper.getTotalAmount(req.session.user._id)
 
  res.render('user/add-address',{ user:req.session.user, products, total, cartCount, usercart: true,})
  
})

router.post('/add-address', (req,res) => {
  //console.log(req.body)
  userHelper.addAddress(req.body).then((response) => {
    res.redirect('/checkout')
  })
})

router.post('/checkout',verifyLogin, async(req, res) => {
  const selectedAddressId = req.body["selected-address"][0];
  const paymentMethod = req.body["payment-method"]
  //console.log(selectedAddressId,paymentMethod)

  let selectedAddress = await userHelper.getOneAddress(selectedAddressId)
  let total = await userHelper.getTotalAmount(req.session.user._id)
  let cart = await userHelper.getCartProductList(req.session.user._id)
  let products = cart.products
  // console.log(products)
  userHelper.placeOrder(paymentMethod,selectedAddress,total,products,req.session.user._id).then((response) => {
    res.json({status: true})
  })
})

module.exports = router;
