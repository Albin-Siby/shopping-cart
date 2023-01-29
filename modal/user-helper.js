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
    getUser: (userId) => {
        return new Promise(async(res,rej) => {
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({_id: ObjectId(userId)})
            res(user)
        })
    },
    updateAccountDetails: (userId,userDetails) => {
        return new Promise(async(res,rej) => {
            await db.get().collection(collections.USER_COLLECTION)
            .findOneAndUpdate({_id: ObjectId(userId)},{$set:userDetails})
            .then((response) => {
                res({status: true})
            })
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
                        total: {
                            $cond: {
                              if: { $ne: ['$product.OfferPrice', '0'] },
                            //   then: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.OfferPrice' }] } },
                                then: "",
                              else: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.Price' }] } }
                            }
                          },
                          offerTotal: {
                            $cond: {
                              if: { $ne: ['$product.OfferPrice', '0'] },
                              then: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.OfferPrice' }] } },
                              else: ""
                            }
                        }
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:1,total:1,offerTotal:1
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
    getTotalAmount: (userId,products) => {    
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
                    $group: { 
                        _id: null,
                        total: {
                            $sum: {
                                $cond: {
                                    if: { $ne: ['$product.OfferPrice', '0'] },
                                    then: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.OfferPrice' }] },
                                    else: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$product.Price' }] }
                                }
                            }
                        }
                    }
                },
                
            ]).toArray()
            //console.log(total)
                res(total[0].total) 
        })
    },
    addAddress: (address,userId) => {
        const addrObj = {
            user: ObjectId(userId),
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
    deleteAddress: (addrId) => {
        return new Promise((res,rej) => {
            db.get().collection(collections.ADDRESS_COLLECTION).deleteOne({_id: ObjectId(addrId)}).then((data) => {
                res(data)
            })
        })
    },
    getAddress: (userId) => {
        return new Promise(async(res,rej) => {
            let allAddress = await db.get().collection(collections.ADDRESS_COLLECTION).find({user: ObjectId(userId)}).toArray()
            res(allAddress)
    })
    },
    getOneAddress: (addressId) => {
        return new Promise((res,rej) => {
            db.get().collection(collections.ADDRESS_COLLECTION).findOne({_id: ObjectId(addressId)}).then((address) => {
                res(address)
            })
        })
    },
    getCartProductList: (userId) => {
        return new Promise((res,rej) => {
            let cart = db.get().collection(collections.CART_COLLECTION).findOne({user: ObjectId(userId)})
            res(cart)
        })
    },
    placeOrder: (pMethod,address,total,products,userId) => {
        return new Promise((res,rej) => {
            //console.log(pMethod,address,total,products)
            let status = pMethod === 'COD'?'placed':'pending'
            let ordObj = {
                deliveryDetails: {
                    firstName: address.fname,
                    lastName: address.lname,
                    address: address.address,
                    town: address.town,
                    state: address.state,
                    country: address.country,
                    pin: address.pin,
                    phone: address.phone,
                    email: address.email
                },
                userId: userId,
                paymentMethod: pMethod,
                products: products,
                total: total,
                status: status,
                date: new Date().toLocaleDateString('en-IN', {day: '2-digit', month: '2-digit', year: 'numeric'})
            }

            db.get().collection(collections.ORDER_COLLECTION).insertOne(ordObj).then((response) => {
                products.forEach(async(product) => {
                    let decrement = -1 * product.quantity;
                    await db.get().collection(collections.PRODUCT_COLLECTION)
                    .updateOne({_id: ObjectId(product.item)}, {$inc: { Stock: decrement}})
                   
                })
                db.get().collection(collections.CART_COLLECTION).deleteOne({user: ObjectId(userId)})
                res()
            })
        })
    },
    getUserOrder: (userId) => {
        //console.log(userId)
        return new Promise(async(res,rej) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find({userId: userId}).toArray()
            //console.log(orders)
            res(orders)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async(res,rej) => {
            let orderItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id: ObjectId(orderId)}
                },
                {
                    $project:{
                        products: 1,
                        status: 1
                    }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item: '$products.item',
                        quantity: '$products.quantity',
                         status: "$status",
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
                // {
                //     $project:{
                //         item:1,
                //         quantity:1,
                //         product:1,
                //         status: "$status",
                //     }
                // },
                // {
                //     $addFields: {
                //         product: {
                //             $map: {
                //                 input: "$product",
                //                 as: "p",
                //                 in: { $mergeObjects: [ "$$p", { status: "$status" } ] }
                //             }
                //         }
                //     }
                // },                
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:["$product",0]},
                        status: "$status",
                    }
                }
            ]).toArray()
            //console.log(orderItems)
            res(orderItems)
        })
    },
    // cancelProduct: (orderId, proId) => {
    //     return new Promise((res, rej) => {
    //         db.get().collection(collections.ORDER_COLLECTION)
    //         .aggregate([
    //             { $match: { _id: ObjectId(orderId) } },
    //             { $unwind: "$products" },
    //             { $match: { "products.item": ObjectId(proId) } },
    //             {
    //                 $lookup:{
    //                     from: collections.PRODUCT_COLLECTION,
    //                     localField: 'item',
    //                     foreignField: '_id',
    //                     as: 'product'
    //                 }
    //             },
    //             { $project: { _id: 0, product:1, price: "$product.price" } }
    //         ]).toArray()
    //         .then((result) => {
    //             console.log(result)
    //             const canceledProductPrice = parseInt(result[0].price);
    //             db.get().collection(collections.ORDER_COLLECTION)
    //             .updateOne(
    //                 { _id: ObjectId(orderId) },
    //                 { $inc: { total: -canceledProductPrice }, $pull: { "products": { "item": ObjectId(proId) } } }
    //             )            
    //             .then((response) => {
    //                 db.get().collection(collections.ORDER_COLLECTION)
    //                 .findOne({ _id: ObjectId(orderId) }, { total: 1 })
    //                 .then((order) => {
    //                     res({ status: true, total: order.total });
    //                 });
    //             });
    //         });
    //     });
    // },
    cancelProduct: (orderId,proId) => {
        return new Promise(async(res,rej) => {
            let price;
            await db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id: ObjectId(proId)}).then((data) => {
                if(data.OfferPrice === '0') {
                    price = data.Price
                } else {
                    price = data.OfferPrice
                }
            })
            const order = await db.get().collection(collections.ORDER_COLLECTION)
            .findOne({ _id: ObjectId(orderId) });

            if(order.products.length > 1) {
                await db.get().collection(collections.ORDER_COLLECTION)
                .updateOne( 
                    { _id: ObjectId(orderId) }, 
                    { $inc: { total: -price }, $pull: { "products": { "item": ObjectId(proId) } } } 
                ).then((response) => {
                    res({status: true, length: true})
                })
            } else {
                await db.get().collection(collections.ORDER_COLLECTION)
                .deleteOne({ _id: ObjectId(orderId) })
                .then(response => {
                    res({ status: true, length: false });
                });
            }
        })
    },
    getOneCategory: (cId) => {
        return new Promise(async(res,rej) => {
            let oneCategory = await db.get().collection(collections.CATEGORY_COLLECTION).findOne({_id: ObjectId(cId)})
            let categoryDetails = await db.get().collection(collections.PRODUCT_COLLECTION).find({Category: oneCategory.Name}).toArray()
            res(categoryDetails)
        })
    }

}