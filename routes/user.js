var express = require('express');
var router = express.Router();
var productHelper = require('../modal/product-helper')
var userHelper = require('../modal/user-helper')

const verifyLogin = (req,res,next) => {
  if(req.session.user) {
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

  let categories = await productHelper.getAllCategory()
  console.log(categories)
  productHelper.getAllProducts().then((products) => {
    let offerProducts = [];
    let normalProducts = [];
    products.forEach(product => {
      if(product.OfferPrice === '0' ) {
        normalProducts.push(product);
      } else {
        offerProducts.push(product);
      }
    });
    //console.log(offerProducts)
    res.render('./user/view-products', { normalProducts, offerProducts, categories, user: req.session.user, productCount, usercart: false });
  })

});

router.get('/show-product/:id', async(req,res) => {
  let proId = req.params.id  
  let productCount = null
  let usercart
  
  if(req.session.user) {
    productCount =await userHelper.getCartProductCount(req.session.user._id)
    
  }                              
  let oneProduct =await productHelper.getProductDetails(proId)
  if(oneProduct.OfferPrice === '0') {
    oneProduct.OfferPrice = ''
  }  
  //console.log(oneProduct)
  res.render('user/show-product', { oneProduct, user:req.session.user, productCount, usercart: false, admin: false })
})

router.get('/signup', (req,res) => {
  res.render('user/signup')
})

router.get('/login', (req,res) => {
  if(req.session.user){
    res.redirect('/')
  } else{
    res.render('user/login')
    
  }
})

router.post('/signup', (req,res) => {
  userHelper.doSignup(req.body).then((userData) => {
    //console.log(userData)  
    req.session.user = userData
    req.session.user.loggedIn = true
    res.redirect('/login')
  })
})

router.post('/login', (req,res) => {
  userHelper.doLogin(req.body).then((respond) => {
    if(respond.Status) {
      req.session.user = respond.user;
      req.session.user.loggedIn= true;
      
      res.redirect('/')
    } else {
      res.redirect('/login')
    }
  })
})

router.get('/user/logout', (req,res) => {
  req.session.user = null
  res.redirect('/')
})

router.get('/user/useraccount',verifyLogin, async(req,res) => {
  let productCount = null
  let usercart
  
  if(req.session.user) {
    productCount =await userHelper.getCartProductCount(req.session.user._id)
    
  }
  let userDetails = await userHelper.getUser(req.session.user._id)
  let allAddress = await userHelper.getAddress(req.session.user._id)

  res.render('user/useraccount', { user:req.session.user, productCount, usercart: false, userDetails, allAddress })
})

router.post('/changedetails', (req,res) => {
  let userDetails = req.body
  userHelper.updateAccountDetails(req.session.user._id,userDetails).then((response) => {
    res.json(response)
  })
})

router.get('/category/:id', async(req,res) => {
  let cId = req.params.id
  let productCount = null
  let usercart
  
  if(req.session.user) {
    productCount =await userHelper.getCartProductCount(req.session.user._id)
    
  }
  let oneCategory = await userHelper.getOneCategory(cId)
  //console.log(oneCategory)
  
  res.render('user/category', { oneCategory, user:req.session.user, productCount, usercart: false, admin: false })
})

router.get('/cart',verifyLogin, async(req,res) => {
  let cartCount = null
  let usercart
  
  if(req.session.user) {
    cartCount =await userHelper.getCartCount(req.session.user._id)
    
  }

  let products = await userHelper.getCartProducts(req.session.user._id)
  for (let i = 0; i < products.length; i++) {
    if (products[i].product.OfferPrice === '0') {
      products[i].product.OfferPrice = '';
    }
  }
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
  if(req.session.user) {
    userHelper.addToCart(proId,req.session.user._id).then(() => {
      //res.redirect('/')
      res.json({status: true})
    })
  } else {
    res.json({status:false})
  }
  
})

router.post("/change-product-quantity", (req,res,next) => {
  //console.log(req.body)
  userHelper.changeProductQuantity(req.body).then(async(response) => {
    response.subtotal = await userHelper.getTotalAmount(req.body.user)
    response.total = await userHelper.getCartProducts(req.body.user) 
    //console.log(response.total)
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
  userHelper.getAddress(req.session.user._id).then((allAddress) => {
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

router.post('/add-address',verifyLogin, (req,res) => {
  //console.log(req.body)
  userHelper.addAddress(req.body,req.session.user._id).then((addrData) => {
    // req.session.user = addrData;
    res.redirect('/checkout')
  })
})

router.get('/checkout/delete-address/:id',verifyLogin, (req,res) => {
  let addrId = req.params.id
  userHelper.deleteAddress(addrId).then((data) => {
    res.redirect('/checkout/')
  })
})

router.post('/checkout',verifyLogin, async(req, res) => {
  try {
    //console.log(req.body)
    const { 'selected-address': selectedAddressId, 'payment-method': paymentMethod } = req.body;

    let selectedAddress = await userHelper.getOneAddress(selectedAddressId)
    let total = await userHelper.getTotalAmount(req.session.user._id)
    let cart = await userHelper.getCartProductList(req.session.user._id)
    let products = cart.products
    //console.log(products)
    userHelper.placeOrder(paymentMethod,selectedAddress,total,products,req.session.user._id).then((response) => {
      res.json({status: true})
      return 
    })
  } catch (error) {
    console.log(error)
  }
})


router.get('/orderplaced',verifyLogin, async(req,res) => {
  let user = req.session.user
  let productCount = null
  let usercart
  
  if(req.session.user) {
    productCount =await userHelper.getCartProductCount(req.session.user._id)
    
  }
  res.render('user/orderplaced', { user, productCount, usercart:false })
})

router.get('/orders',verifyLogin, async(req,res) => {
  let user = req.session.user
  //console.log(user)
  let productCount = null
  let usercart
  
  if(req.session.user) {
    productCount =await userHelper.getCartProductCount(req.session.user._id)
    
  }
  let orders = await userHelper.getUserOrder(req.session.user._id)
  res.render('user/orders', { user: req.session.user, orders, productCount, usercart:false })
})

router.get('/orderedProducts/:id',verifyLogin, async(req,res) => {

  let productCount = null
  let usercart
  
  if(req.session.user) {
    productCount =await userHelper.getCartProductCount(req.session.user._id) 
  }

  let orderId = req.params.id
  //console.log(orderId)
  let orders = await userHelper.getUserOrder(req.session.user._id)
  let orderProducts = await userHelper.getOrderProducts(orderId)

  for (let i = 0; i < orderProducts.length; i++) {
    if (orderProducts[i].product.OfferPrice === '0') {
      orderProducts[i].product.OfferPrice = '';
    }
  }
  
  let oneOrder = orders.filter((order) => {
    return(order._id == orderId) 
    
  })

  //console.log(oneOrder) 
  res.render('user/orderedProducts', { user:req.session.user, orderProducts, oneOrder, productCount, usercart:false })
  
})

router.post('/cancel-product', (req,res) => {
  let orderId = req.body.orderId
  let proId = req.body.proId
  userHelper.cancelProduct(orderId,proId).then((response) => {
    res.json(response)
  })
})

module.exports = router;
