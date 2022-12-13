var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helper')

/* GET home page. */
router.get('/', function(req, res, next) {

  productHelper.getAllProducts().then((products) => {
    res.render('user/view-products', { products, admin: false });
  })

});

module.exports = router;
