var express = require('express');
var router = express.Router();
var productHelper = require('../modal/product-helper')
var userHelper = require('../modal/user-helper')
const { check, validationResult } = require("express-validator");

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

router.get('/signup', (req, res) => {
  let errors = req.session.errors || [];
  let values = req.session.values || {};

  if (errors.length > 0) {
    let firstError = errors[0];
    res.render('user/signup', { 
      errors: [firstError], 
      values: values
    });
  } else {
    res.render('user/signup', { 
      errors: [], 
      values: values
    });
  }
})


router.get('/login', (req,res) => {
  if(req.session.user){
    res.redirect('/')
  } else{
    res.render('user/login', { loginError: req.session.loginError || [], values: req.session.values || {} })
    
  }
})

router.post("/signup", [
  check("Name").not().isEmpty().withMessage("Name is required"),
  check("Email").not().isEmpty().withMessage("Email is required").isEmail().withMessage("Email is invalid"),
  check("Mobile").not().isEmpty().withMessage("Mobile is required").isLength({ min: 10, max: 10 }).withMessage("Mobile is invalid"),
  check("Password").not().isEmpty().withMessage("Password is required").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
], (req, res) => {
  const errors = validationResult(req);
  //console.log(errors)
  if (!errors.isEmpty()) {
    let allNull = true;
    if (errors.array().findIndex(error => error.param === "Name") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Email") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Mobile") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Password") === -1) {
      allNull = false;
    }
    if (allNull) {
      req.session.errors = [{ msg: "All fields are required" }];
      return res.redirect('/signup');
      } else {
      req.session.values = req.body;
      req.session.errors = errors.array();
      return res.redirect('/signup');
      }
  }

  userHelper.doSignup(req.body).then((userData) => {
    //console.log(userData) 
    if(userData.signupErr) {
      let signupError = userData.message;
      res.render('user/signup', {signupError})
    } else {
      res.redirect('/login')
    }
    
  })
})

router.post('/login',[
  check("Email").not().isEmpty().withMessage("Email is required"),
  check("Password").not().isEmpty().withMessage("Password is required")
], (req,res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    let allNull = true;
    if (errors.array().findIndex(error => error.param === "Email") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Password") === -1) {
      allNull = false;
    }
    if(allNull) {
      req.session.loginError = [{ msg: "All fields are required" }];
      return res.redirect('/login');
      } else {
      req.session.values = req.body;
      req.session.loginError = errors.array();
      return res.redirect('/login');
      }
    }

  userHelper.doLogin(req.body).then((respond) => {
    if(respond.Status) {
      req.session.user = respond.user;
      req.session.user.loggedIn= true;
      
      res.redirect('/')
    } else {
      let loginErr = respond.msg
      console.log(req.session.loginErr)
      res.render('user/login', { loginErr })
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
  oneCategory.forEach((category) => {
    if(category.OfferPrice === '0') {
      category.OfferPrice = ''
    }
  })
  console.log(oneCategory)
  
  res.render('user/category', { oneCategory, user:req.session.user, productCount, cId, usercart: false, admin: false })
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

  let errors = req.session.errors || [];
  let values = req.session.values || {};

  if (errors.length > 0) {
    let firstError = errors[0];
    res.render('user/add-address',{ errors: [firstError], 
      values: values,
      user:req.session.user, 
      products, total, cartCount, 
      usercart: true
    });
  } else {
    res.render('user/add-address',{errors: [], 
      values: values,
      user:req.session.user, 
      products, total, cartCount, 
      usercart: true
    })
  }  
  
})

router.post('/add-address',verifyLogin,[
  check("Fname").not().isEmpty().withMessage("First Name is required"),
  check("Lname").not().isEmpty().withMessage("Last Name is required"),
  check("Address").not().isEmpty().withMessage("Address is required"),
  check("Town").not().isEmpty().withMessage("Town is required"),
  check("State").not().isEmpty().withMessage("State is required"),
  check("Country").not().isEmpty().withMessage("Country is required"),
  check("PinCode").not().isEmpty().withMessage("Zipcode is required"),
  check("Phone").not().isEmpty().withMessage("Phone number is required").isLength({ min: 10, max: 10 }).withMessage("Invalid phone number"),
  check("Email").not().isEmpty().withMessage("Email is required").isEmail().withMessage("Email is invalid"),
], (req,res) => {
  //console.log(req.body)
  const errors = validationResult(req);
  //console.log(errors)
  if (!errors.isEmpty()) {
    let allNull = true;
    if (errors.array().findIndex(error => error.param === "Fname") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Lname") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Address") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Town") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "State") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Country") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "PinCode") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Phone") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Email") === -1) {
      allNull = false;
    }
    if (allNull) {
      req.session.errors = [{ msg: "All fields are required" }];
      return res.redirect('/add-address');
      } else {
      req.session.values = req.body;
      req.session.errors = errors.array();
      return res.redirect('/add-address');
      }
  }

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

router.post('/applyfilter', async(req,res) => {
  let maxPrice = req.body.maxValue
  let cId = req.body.cId
  let filteredProducts = []

  let products = await userHelper.getFilteredProducts(maxPrice,cId)
  
  products.forEach((product) => {
    if(product.OfferPrice === '0') {
      if(product.Price <= maxPrice) {
        filteredProducts.push(product)
      }
    } else {
      if(product.OfferPrice <= maxPrice) {
        filteredProducts.push(product)
      }
    }
  })
  
  filteredProducts.forEach((product) => {
    if(product.OfferPrice === '0') {
      product.OfferPrice = ''
    }
  })
  //console.log(filteredProducts)
  res.json({filteredProducts})
})

router.post('/changepassword',[
  check("Cpass").not().isEmpty().withMessage("Current Password is required"),
  check("Npass").not().isEmpty().withMessage("New Password is required").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  check("Cnpass").not().isEmpty().withMessage("Confirm Password is required") 
], async(req,res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    let allNull = true;
    if (errors.array().findIndex(error => error.param === "Cpass") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Npass") === -1) {
      allNull = false;
    }
    if (errors.array().findIndex(error => error.param === "Cnpass") === -1) {
      allNull = false;
    }
    if (allNull) {
      req.session.passworderrors = [{ msg: "All fields are required" }];
      return res.json({ err: req.session.passworderrors })
      } else {
      req.session.passworderrors = errors.array();
      return res.json({ errors: errors.array() })
      }
  }

  let cPassword = req.body.Cpass
  let newPassword = req.body.Npass
  let conPassword = req.body.Cnpass
  if(conPassword !== newPassword) {
    return res.json({msg: "Confirm password must match new password"})
  }
  
  await userHelper.changePassword(cPassword,newPassword,req.session.user._id).then((response) => {
    res.json(response)
  })
 
})

module.exports = router;