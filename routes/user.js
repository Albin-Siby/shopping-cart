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
  let cartCount = null
  if(req.session.user) {
    cartCount =await userHelper.getCartCount(req.session.user._id)
    
  }

  productHelper.getAllProducts().then((products) => {
    res.render('./user/view-products', { products, user, cartCount });
  })

});

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
  let products = await userHelper.getCartProducts(req.session.user._id)
    console.log(products)
    res.render('user/cart', { products, user:req.session.user })
    
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
  userHelper.changeProductQuantity(req.body).then((response) => {
    res.json(response)
  })
})

module.exports = router;
