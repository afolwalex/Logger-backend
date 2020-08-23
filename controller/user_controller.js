
const User = require('../model/user')
const Refresh = require('../model/refresh_token')

const bcrypt = require('bcryptjs')
const crypto = require("crypto");
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')

const transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: '9d7154ba637b1a',
        pass: 'b648c2520ea8cb',
    }
});

function sendVerifyMessage(origin, user) {
    let verifyUrl = `${origin}/account/verify-email?token=${user.verificationToken}`
	let message = `
	    <div style="padding:2rem;font-size:1rem;font-family : Roboto , Helvetica">
		    <h2> Hello , ${user.firstName}</h2>
            <p> Thank you for registering. Please verify your email by clicking on this <a href="${verifyUrl}">link</a></p>
            <p>You can also use the link below:</p>
            <p><a href="${verifyUrl}">${verifyUrl}</a></p>
	    </div>`
	return message 
}

function sendResetMessage(origin, user) {
    let resetUrl = `${origin}/account/reset-password?token=${user.resetToken.token}`
	let message = `
	    <div style="padding:2rem;font-size:1rem;font-family : Roboto , Helvetica">
		    <h2> Hello , ${user.firstName}</h2>
            <p>Please visit this <a href="${resetUrl}">link</a> to change your password.</p>
            <p>You can also use the link below:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
	    </div>`
	return message 
}

class App{

    registerUsers = async (req, res, next) => {
        try{
            const {firstName, lastName, otherName, email, mobile, picture, password, contactAddress, 
                state, country, gender } = req.body
            let confirmUser = await User.find({ $or : [{email : email}, {mobile : mobile}]})
            if(confirmUser.length == 0){
                const userPass = await bcrypt.hash(password , 10)
                console.log(userPass)
                let createUser = await new User({
                    firstName  : firstName , 
                    lastName  : lastName , 
                    otherName : otherName,
                    password : userPass,
                    email     : email , 
                    mobile    : mobile, 
                    picture : picture,
                    address : {
                        contactAddress : contactAddress,
                        state : state,
                        country : country
                    },
                    role : 'User', 
                    dateOfBirth : gender,
                    verificationToken : crypto.randomBytes(40).toString('hex') 		
                })
                let savedUser = await createUser.save() 
                if (savedUser) {
        
                    const mailOption = ({
                        to   : savedUser.email , 
                        subject : 'Registration Successful' , 
                        html  : sendVerifyMessage(req.get('host'), savedUser) 
                    })
                    transport.sendMail(mailOption , (err , msg) => {
                        if ( err ) {
                            console.log(err)
                            res.json({message : "Unable to send mail."})
                            return
                        }else {
                            res.json({message : "Your account has been created. Please verify your email to login."})
                            return
                        }
                    })
            
                }else{
                    throw{
                        message : "There is a problem with your network settings."
                    }
                }
            }else{
                throw{
                    message : "You have an account created already. Please, proceed to login."
                }
            }
        }catch(error){
            res.json({message: error.message})
            return
        }
    }

    verifyEmail = async (req, res, next) => {
        try{
            const user = await User.findOne({verificationToken : req.body.token})
            if(user){
                User.findByIdAndUpdate(user._id , {
                    verified : true,
                    verificationToken : undefined 
                } ,{new : true, useFindAndModify : false}, (err , item) => {
                    if(err){
                        res.status(500)
                        return
                    }else{
                        res.json({message : "Your account has been verified. You can now login."})
                    }
                })
            }else{
                res.json({message : "Account verification failed."})
            }
        }catch(error){
            res.json({message: error})
            return
        }
    }

    forgotPassword = async (req, res, next) => {
        try{
            const user = await User.findOne({email : req.body.email})
            if(user){
                let generateToken = crypto.randomBytes(40).toString('hex')
                User.findByIdAndUpdate(user._id , {
                    resetToken : {
                        token: generateToken,
                        expires: new Date(Date.now() + 24*60*60*1000)
                    }
                } ,{new : true, useFindAndModify : false}, (err , item) => {
                    if(err){
                        res.status(500)
                        return
                    }else{
                        const mailOption = ({
                            to   : savedUser.email , 
                            subject : 'Registration Successful' , 
                            html  : sendResetMessage(req.get('host'), savedUser) 
                        })
                        transport.sendMail(mailOption , (err , msg) => {
                            if ( err ) {
                                console.log(err)
                                res.json({message : "Unable to send mail."})
                                return
                            }else {
                                res.json({
                                    message : "Please check your email for password reset instructions."
                                })
                                return
                            }
                        })
                    }
                })
            }else{
                res.json({message : "Email not found. You need to register."})
            }
        }catch(error){
            res.json({message : error})
            return
        }
    }

    validateResetPassword = async (req, res, next) => {
        try{
            const {token} = req.body
            const user = await User.findOne({
                'resetToken.token': token,
                'resetToken.expires': { $gt: Date.now() }
            })
            if(user){
                res.json({message: "Token is valid."})
            }else{
                res.json({message: "Invalid Token."})
            }
        }catch(error){
            res.json({message : error})
        }
    }

    resetPassword = async (req, res, next) => {
        try{
            const {token, password, confirmPassword} = req.body
            const user = await User.findOne({
                'resetToken.token': token,
                'resetToken.expires': { $gt: Date.now() }
            })
            if(user){
                if(password == confirmPassword && password != null && confirmPassword != null){
                    const userPass = await bcrypt.hash(password , 10)
                    User.findByIdAndUpdate(user._id, {
                        password : userPass
                    }, {new : true, useFindAndModify : false}, (err , item) => {
                        if(err){
                            res.status(500)
                            return
                        }else{
                            res.json({message : "Your password has been changed."})
                        }
                    })
                }else{
                    res.json({message : "There is something wrong with your passwords."})
                }
            }else{
                res.json({message : "Invalid Token."})
            }
        }catch(error){
            res.json({message : error})
        }
    }

    authenticate = async (req, res, next) => {
        try{
            const {email, password} = req.body
            const findUser = await User.findOne({email: email, verified: true})
            if(findUser){
                let validUser = await bcrypt.compare(password , findUser.password)
                if(validUser){
                    let refreshToken = await new Refresh({
                        user  : findUser._id, 
                        token  : crypto.randomBytes(40).toString('hex') , 
                        expires : new Date(Date.now() + 7*24*60*60*1000),
                        createdByIp: req.ip		
                    })
                    let saveRefreshToken = await refreshToken.save()

                    const TOKEN_PAYLOAD = {
                        id: findUser._id, 
                        email: findUser.email  
                    }
                    const API_KEY = {
                        secret : "23dfrtvkvkfif0r0rldlsksiie8e440099ididduue7e" 
                    }
                    jwt.sign(TOKEN_PAYLOAD , API_KEY.secret , {
                        algorithm : "HS256" , expiresIn : "15m" ,
                        issuer : "Olawale" , subject : "Authorization"
                    } , (err , token) => {
                        if ( err) {
                            throw {
                                status : 400 , 
                                message : "Problem with your request"
                            }
                        }

                        const cookieOptions = {
                            httpOnly: true,
                            expires: new Date(Date.now() + 7*24*60*60*1000)
                        };
    
                        res.cookie('refreshToken', saveRefreshToken.token, cookieOptions);
                       
                        res.json({
                            ...findUser.toObject(), 
                            jwtToken:token
                        })
                    })
                }else{
                    throw{
                        message: "Email or Password is incorrect."
                    } 
                }
            }else{
                throw{
                    message: "Email or Password is incorrect."
                } 
            }
        }catch(error){
            res.json({message : error.message})
        }
    }

    refreshToken = async (req, res, next) => {
        try{
            const token = req.cookies.refreshToken
            const findToken = await Refresh.findOne({token: token})
            const mainUser = await User.findOne({_id : findToken.user})
            if(findToken){
                let newRefreshToken = await new Refresh({
                    user  : findToken.user, 
                    token  : crypto.randomBytes(40).toString('hex') , 
                    expires : new Date(Date.now() + 7*24*60*60*1000),
                    createdByIp: req.ip		
                })
                let saveNewToken = await newRefreshToken.save()
                if(saveNewToken){
                    let updateRefreshToken = await Refresh.findByIdAndUpdate(findToken._id , {
                        revoked: Date.now(),
                        revokedByIp: req.ip,
                        replacedByToken: saveNewToken.token
                    } , {new : true , useFindAndModify : false})
                    if(updateRefreshToken){
                        const TOKEN_PAYLOAD = {
                            id: mainUser._id, 
                            email: mainUser.email  
                        }
                        const API_KEY = {
                            secret : "23dfrtvkvkfif0r0rldlsksiie8e440099ididduue7e" 
                        }
                        jwt.sign(TOKEN_PAYLOAD , API_KEY.secret , {
                            algorithm : "HS256" , expiresIn : "15m" ,
                            issuer : "Olawale" , subject : "Authorization"
                        } , (err , token) => {
                            if ( err) {
                                throw {
                                    status : 400 , 
                                    message : "Problem with your request"
                                }
                            }

                            const cookieOptions = {
                                httpOnly: true,
                                expires: new Date(Date.now() + 7*24*60*60*1000)
                            };
        
                            res.cookie('refreshToken', saveNewToken.token, cookieOptions);
                           
                            res.json({
                                ...mainUser.toObject(), 
                                jwtToken:token
                            })
                        })
                    }else{
                        res.json({message: "Unable to update token changes."})
                    }
                }
            }else{
                res.json({message: "Invalid Token"})
            }
        }catch(error){
            res.json({message: error})
        }
    }

    getUser = async (req, res, next) => {
        try{
            console.log(req.cookies)
            const user = await User.findOne({_id: req.params.id})
            if(user){
                res.json(user)
            }else{
                res.json({message: "Params not found."})
            }
        }catch(error){
            res.json({message: error})
        }
    }


    revokeToken = async (req, res, next) => {
        try{
            const token = req.body.token || req.cookies.refreshToken
            const findToken = await Refresh.findOne({token: token})
            if(findToken){
                let updateToken = await Refresh.findByIdAndUpdate(findToken._id , {
                    revoked: Date.now(),
                    revokedByIp: req.ip,
                } , {new : true , useFindAndModify : false})
                if(updateToken){
                    res.json({message: "Token has been revoked."})
                }
            }else{
                res.json({message: "Invalid Token"})
            }
        }catch(error){
            res.json({message: error})
        }
    }

    updateAccount = async (req, res, next) => {
        try{
            const {firstName, lastName, otherName, email, mobile, picture, password, contactAddress, 
                state, country, dateOfBirth } = req.body

            const findUser = await User.findOne({_id : req.params.id})
            if(findUser){
                const verfiyDetails = await User.find({ $or : [{email : email}, {mobile : mobile}]})
                if(verfiyDetails.length == 0){
                    let updateUserDetails = await User.findByIdAndUpdate(findUser._id , {
                        firstName,
                        lastName,
                        otherName,
                        email,
                        mobile,
                        picture,
                        password,
                        address: {
                            contactAddress,
                            state,
                            country
                        },
                        dateOfBirth
                    } , {new : true , useFindAndModify : false})
                    if(updateUserDetails){
                        res.json(updateUserDetails)
                    }else{
                        res.json({message: "Unable to update."})
                    } 
                }else{
                    res.json({message: "Some of the details you provided has been chosen."})
                }
            }else{
                res.json({message: "Unable to perform operation due to invalid params."})
            }
        }catch(error){
            res.json({message: error})
        }
    }
   
}

let main = new App()

module.exports = main 