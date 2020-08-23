
'use strict'
/**
  *Require module dependencies 
  */
const jwt = require('jsonwebtoken')
/**
 * jwt is an Internet standard for creating json based access tokens 
 * jwt tokens are in three parts : header , payload  , and signature 
 * all signed and encoded as base64url 
 * isAuthenticated is a middleware for checking if request to a protected path contains 
 * a valid token 
 * @param [Object] HTTP req , res , and a call to the next middleware 
 * @return [String] token 
*/
const isAuthenticated = (req , res , next) => {
	if ( typeof req.headers.authorization !== "undefined") {
		let token = req.headers.authorization.split(" ")[1] 
		const header  = {
				"type" : "JWT" , 
				"alg" : "HS256"
		}
		const API_KEY = {
	        secret : "23dfrtvkvkfif0r0rldlsksiie8e440099ididduue7e"
        } 
		jwt.verify(token ,  API_KEY.secret  , {
				algorithm : "HS256" ,
				issuer : "Olawale" , 
				subject : "Authorization"
			} ,  (err , user) => {
			if ( err ) {
				res.json(err)
			}else {
				return next()
			}
		})
	}else {
		res.status(403).json({message : "Your request is missing authorization"})
		
	}
} 

module.exports = isAuthenticated