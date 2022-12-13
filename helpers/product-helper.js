var db = require('../config/connection')
var collections = require('../config/collections')

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
    }
}