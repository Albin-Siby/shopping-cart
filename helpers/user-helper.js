var db = require('../config/connection')
var collections = require('../config/collections')
var bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

module.exports = {
    doSignup: (userData) => {
        return new Promise(async(res,rej) => {
            userData.Password =await bcrypt.hash(userData.Password, 10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data) => {
                userData._id = userData.insertedId
                res(userData)
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async(res,rej) => {
            let loginStatus = false
            let respond = {}
            let user =await db.get().collection(collections.USER_COLLECTION).findOne({Email:userData.Email})
            if(user) {
                bcrypt.compare(userData.Password, user.Password).then((Status) => {
                    if(Status) {
                        respond.user = user
                        respond.Status = true
                        res(respond)
                    } else {
                        res({Status: false})
                    }
                })
            } else {
                res({Status: false})
            }
        })
    },
    addToCart: (prodId,userId) => {
        let proObj = {
            item: ObjectId(prodId),
            quantity: 1
        }
        return new Promise(async(res,rej) => {
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({user: ObjectId(userId)})
            if(userCart) {
                let proExist = userCart.products.findIndex(product => product.item == prodId)
                console.log(proExist)
                if(proExist != -1) {
                    db.get().collection(collections.CART_COLLECTION)
                    .updateOne(
                        {'products.item': ObjectId(prodId)},
                        {
                            $inc:{'products.$.quantity':1}
                        }
                    ).then(()=>{
                        res()
                    })
                } else {
                    db.get().collection(collections.CART_COLLECTION).updateOne({user: ObjectId(userId)},
                    {
                        // $set:{
                        //     user: ObjectId(userId)
                        // },
                        $push:{
                            products: proObj
                        }
                    }).then((respond) => {
                        res()
                    })
                }
            } else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                await db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((respond) => {
                    res()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async(res,rej) => {
            let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user: ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }
                // {
                //     $lookup:{
                //         from: collections.PRODUCT_COLLECTION,
                //         let:{
                //             prodList: '$products'
                //         },
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr: {
                //                         $in:['$_id', '$$prodList']
                //                     }
                //                 }
                //             }
                //         ],
                //         as: 'cartItems'
                //     }
                // }
            ]).toArray()
            console.log(cartItems)
            res(cartItems)
           
        })
    },
    // getCartCount: (userId) => {
    //     return new Promise(async(res,rej) => {
    //         let count = 0
    //         let cart = db.get().collection(collections.CART_COLLECTION)
    //         .find({user: ObjectId(userId)}).toArray()
    //         // .aggregate([
    //         //     {
    //         //        $match: {
    //         //           user: ObjectId(userId),
    //         //        },
    //         //     },
    //         //     {
    //         //        $project: {
    //         //           size: { $size: "$products" },
    //         //        },
    //         //     },
    //         //  ])
    //         //  .toArray();
             
    //         //  res(cart[0].size)
    //         cart.forEach((item) => {
    //             count += item.products.length;
    //           });
    //         res(count)
    //     })
    // }

    getCartCount: (userId) => {
        return new Promise(async(res,rej) => {
          let count = 0;
          let cart;
          try {
            cart = await db.get().collection(collections.CART_COLLECTION)
              .find({user: ObjectId(userId)})
              .toArray();
          } catch (error) {
            console.error(error);
            return rej(error);
          }
      
          if (Array.isArray(cart)) {
            cart.forEach((item) => {
              count += item.products.length;
            });
          }
      
          res(count);
        });
      }
      
}