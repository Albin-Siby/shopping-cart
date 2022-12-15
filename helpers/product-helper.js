var db = require('../config/connection')
var collections = require('../config/collections')
const { ObjectId } = require('mongodb')

module.exports = {
    addProduct: (product, callback) => {
        //console.log(product)

        db.get().collection('products').insertOne(product).then((data) => {
            console.log(data)
            callback(data.insertedId)
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
            db.get().collection(collections.PRODUCT_COLLECTION)
            .updateOne({_id: ObjectId(proId)},{
                $set:{
                    Name: proDetails.Name,
                    Category: proDetails.Category,
                    Price: proDetails.Price,
                    Description: proDetails.Description
                }
            }).then((respond) => {
                res()
            })
        })
    }
}