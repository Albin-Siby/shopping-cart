var db = require('../config/connection')
var collections = require('../config/collections')
const { ObjectId } = require('mongodb')

module.exports = {
    doLogin: (adminData) => {
        return new Promise(async (res, rej) => {
          let admin = await db.get().collection("admin").findOne({username:adminData.username});
          if(admin && admin.password === adminData.password) {
            res({status: true, passwordMatch: true, admin});
          } else {
            res({status: false, passwordMatch: false});
          }
        });
      },
    addProduct: (product, callback) => {
        //console.log(product)
        product.Stock = parseInt(product.Stock)
        db.get().collection('products').insertOne(product).then((data) => {
            //console.log(data)
            callback(data.insertedId)
        })
    },
    addCategory: (category) => {
        return new Promise(async(res,rej) => {
            await db.get().collection(collections.CATEGORY_COLLECTION).insertOne(category).then((response) => {
                res(response)
            })
        })
    },
    getAllProducts: () => {
        return new Promise(async(res,rej) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            res(products)
        })
    },
    deleteProduct: (prodId) => {
        return new Promise((res,rej) => {
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({_id: ObjectId(prodId)}).then((data) => {
                res(data)
            })
        })
    },
    getProductDetails: (proId) => {
        return new Promise((res,rej) => {
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id: ObjectId(proId)}).then((product) => {
                res(product)
            })
        })
    },
    updateProduct: (proId, proDetails) => {
        return new Promise((res,rej) => {
            if(!db) {
                return rej(new Error('Database not initialized'))
            }

            db.get().collection(collections.PRODUCT_COLLECTION)
            .updateOne({_id: ObjectId(proId)},{
                $set:{
                    Name: proDetails.Name,
                    Category: proDetails.Category,
                    Price: proDetails.Price,
                    OfferPrice: proDetails.OfferPrice,
                    Description: proDetails.Description,
                    Stock: proDetails.Stock
                }
            }).then((respond) => {
                res()
            }).catch((error) => {
                rej(error)
            })
        })
    },
    getAllUsers: () => {
        return new Promise(async(res,rej) => {
            let users = await db.get().collection(collections.USER_COLLECTION).find().toArray()
            res(users)
        })
    },
    getAllCategory: () => {
        return new Promise(async(res,rej) => {
            let category = await db.get().collection(collections.CATEGORY_COLLECTION).find().toArray()
            res(category)
        })
    },
    getAllOrders: () => {
        return new Promise(async(res,rej) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find().toArray()
            res(orders)
        })
    },
    getOneOrder: (orderId) => {
        //console.log(orderId)
        return new Promise(async(res,rej) => {
            let order = await db.get().collection(collections.ORDER_COLLECTION).findOne({_id: ObjectId(orderId)})
            res(order)
        })
    },
    changeStatus: (status,orderId) => {
        console.log(status,orderId)
            return new Promise(async(res,rej) => {
              await db.get().collection(collections.ORDER_COLLECTION)
              .findOneAndUpdate({_id: ObjectId(orderId)},{$set:{status: status}})
              .then((response) => {
                res({status: true})
              })
            })
        
    }
    
}