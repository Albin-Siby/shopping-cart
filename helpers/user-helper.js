var db = require('../config/connection')
var collections = require('../config/collections')
var bcrypt = require('bcrypt')

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
    }
}