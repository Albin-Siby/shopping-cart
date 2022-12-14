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
                        {user:ObjectId(userId),'products.item': ObjectId(prodId)},
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
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:["$product",0]}
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:1,
                        total: {$sum:{$multiply:[{ $toInt: '$quantity' },{ $toInt: '$product.Price' }]}}
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:1,total:1
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
            //console.log(cartItems)
            res(cartItems)
           
        })
    },
    // getCartCount: (userId) => {
    //     return new Promise(async(res,rej) => {
    //         let count = 0
    //         let cart = db.get().collection(collections.CART_COLLECTION)
    //         .find({user: ObjectId(userId)}).toArray()
    //         .aggregate([
    //             {
    //                $match: {
    //                   user: ObjectId(userId),
    //                },
    //             },
    //             {
    //                $project: {
    //                   size: { $size: "$products" },
    //                },
    //             },
    //          ])
    //          .toArray();
             
    //          res(cart[0].size)
    //         cart.forEach((item) => {
    //             count += item.products.length;
    //           });
    //         res(count)
    //     })
    // }

    getCartProductCount: (userId) => {
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
          //console.log(cart[0].products)
            if (Array.isArray(cart)) {
                cart.forEach((item) => {
                item.products.forEach((product) => {
                    count += product.quantity
                 })
                });
            }

          res(count);
        });
    },
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
          //console.log(cart[0].products)
        
        if (Array.isArray(cart)) {
            cart.forEach((item) => {
                count += item.products.length
            });
        }

        res(count);
        });
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        return new Promise((res,rej) => {
            if(details.count == -1 && details.quantity == 1) {
                db.get().collection(collections.CART_COLLECTION).findOne({_id:ObjectId(details.product)})
                .then((response) => {
                    res({maxLimit: true})
                })
            } else {
           
                db.get().collection(collections.CART_COLLECTION)
                .updateOne(
                    {_id:ObjectId(details.cart),'products.item': ObjectId(details.product)},
                    {
                        $inc:{'products.$.quantity':details.count}
                    }
                ).then((response)=>{
                    //console.log(response)
                    res({status:true})
                })
            }  
        })
    },
    deleteProduct: (details) => {
        console.log(details)
        return new Promise((res,rej) => {
            db.get().collection(collections.CART_COLLECTION)
            .updateOne({_id: ObjectId(details.cart)},
            {
                $pull:{products:{item: ObjectId(details.product)}}
            }
            ).then((response) => {
                //console.log(response)
                res({removeStatus: true})
            })
        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async(res,rej) => {
            let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
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
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:["$product",0]}
                    }
                },
                {
                    $group: { _id: null,
                        total: {$sum:{$multiply:[{ $toInt: '$quantity' },{ $toInt: '$product.Price' }]}}
                    }
                }
            ]).toArray()
            //console.log(total)
            res(total[0].total)
           
        })
    },
    addAddress: (address) => {
        const addrObj = {
            user: ObjectId(address.userId),
            fname: address.Fname,
            lname: address.Lname,
            address: address.Address,
            town: address.Town,
            state: address.State,
            country: address.Country,
            pin: address.PinCode,
            phone: address.Phone,
            email: address.Email
        }
        //console.log(addrObj)
        return new Promise((res,rej) => {
            try{
                db.get().collection(collections.ADDRESS_COLLECTION).insertOne(addrObj).then((data) => {
                    //console.log(data)
                    res(data)
                })
            }catch(error) {
                console.log(error)
                rej(error)
            }
            
        })
    },
    getAddress: () => {
        return new Promise(async(res,rej) => {
            let allAddress = await db.get().collection(collections.ADDRESS_COLLECTION).find().toArray()
            res(allAddress)
    })
    },
    getOneAddress: (addressId) => {
        return new Promise((res,rej) => {
            db.get().collection(collections.ADDRESS_COLLECTION).findOne({_id: ObjectId(addressId)}).then((address) => {
                res(address)
            })
        })
    }
      
}