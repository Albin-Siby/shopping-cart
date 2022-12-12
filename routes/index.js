var express = require('express');
var router = express.Router();

/* GET home page. */
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

  res.render('index', { products, admin: false });
});

module.exports = router;
