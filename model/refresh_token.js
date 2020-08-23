
const mongoose = require("mongoose") 
const Schema = mongoose.Schema 

const refreshSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'user' },
    token: String,
    expires: Date,
    created: { type: Date, default: Date.now() },
    createdByIp: String,
    revoked: Date,
    revokedByIp: String,
    replacedByToken: String
}) 

module.exports = mongoose.model('RefreshToken' , refreshSchema)
