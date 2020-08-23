
const mongoose = require("mongoose") 
const Schema = mongoose.Schema 

const userSchema = new Schema({
    firstName : { type : String }, 
    lastName : { type : String } ,
    otherName : { type : String }, 
    password : { type : String },
    dateOfBirth : { type : String}, 
    address : {
        contactAddress: String,
        state : String , 
        country : String
    },
    mobile : { type : String } , 
    email : { type : String } , 
    picture : { type : String },
    role: { type: String },
    verificationToken:{ type: String },
    verified: { type: Boolean, default: false },
    resetToken: {
        token: String,
        expires: Date
    },
    passwordResetDate: { type: Date },
    updated: Date,
    date_registered : {type : Date, default : Date.now()}
}) 

module.exports = mongoose.model('user' , userSchema)
