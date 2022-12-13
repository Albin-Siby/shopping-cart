var express = require('express');
const fileUpload = require('express-fileupload');
var router = express.Router();
var productHelper = require('../helpers/product-helper')

/* GET users listing. */
router.get('/', function(req, res, next) {

  let products = [
    {
      name: "iPhone 11",
      category: "Mobile",
      price: 65000,
      description: "This is a good phone and have many features.",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPI7O_OioNSEd3vEtYim6v9GY5bOb0SGlGHg&usqp=CAU"
    },
    {
      name: "Samsung Galaxy",
      category: "Mobile",
      price: 16500,
      description: "This is a good phone and have many features.",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRZrDdeHcs9qzlLl3IPMmz8TlH7sXw0Rll7Q&usqp=CAU"
    },
    {
      name: "HP Laptop",
      category: "Laptop",
      price: 45000,
      description: "This is a good laptop and have good specifications.",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSE8rjtE8zyEfC1OEAlQzOXJxklrE6UtEpU2A&usqp=CAU"
    },
    {
      name: "JBL xtreme 2",
      category: "Bluetooth Speaker",
      price: 1500,
      description: "India's number 1 brand item and 6 hours playtime.",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTn77AUM9LsBEym2tvv1AadrGHqzl25jI4guA&usqp=CAU"
    }
  ]

  res.render('admin/view-products', {admin: true, products})
});

router.get('/add-products', (req,res) => {
  res.render('admin/add-products', {admin: true})
})

router.post('/add-products',fileUpload(), (req,res) => {
  // console.log(req.body)
  // console.log(req.files.image)

  productHelper.addProduct(req.body, (id) => {
    let image = req.files.image
    image.mv('./public/product-images/'+id+".jpg", (err) => {
      if(!err) {
        res.render('admin/add-products')
      } else {
        console.log(err)
      }
    })
    
  })
})

module.exports = router;
