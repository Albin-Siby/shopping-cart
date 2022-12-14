var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helper')
var userHelper = require('../helpers/user-helper')

/* GET home page. */
router.get('/', function(req, res, next) {
  let user = req.session.user
  //console.log(user)
  productHelper.getAllProducts().then((products) => {
    res.render('./user/view-products', { products, user });
  })

});

router.get('/signup', (req,res) => {
  res.render('user/signup')
})

router.get('/login', (req,res) => {
  res.render('user/login')
})

router.post('/signup', (req,res) => {
  userHelper.doSignup(req.body).then((userData) => {
    //console.log(userData)
  })
})

router.post('/login', (req,res) => {
  userHelper.doLogin(req.body).then((respond) => {
    if(respond.Status) {
      req.session.loggedIn= true;
      req.session.user = respond.user;
      res.redirect('/')
    } else {
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req,res) => {
  req.session.destroy()
  res.redirect('/')
})

module.exports = router;
