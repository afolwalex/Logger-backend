const express = require('express');
const router = express.Router();
const isAuthenticated = require('../jwt') 

const UserController = require('../controller/user_controller')
 
router.post('/account/register', UserController.registerUsers)
router.post('/account/verify-email', UserController.verifyEmail)
router.post('/account/forgot-password', UserController.forgotPassword)
router.post('/account/validate-reset-password', UserController.validateResetPassword)
router.post('/account/reset-password', UserController.resetPassword)
router.post('/account/authenticate', UserController.authenticate)
router.post('/account/refresh-token', UserController.refreshToken)
router.get('/account/:id', isAuthenticated, UserController.getUser)
router.put('/account/:id', isAuthenticated, UserController.updateAccount)
router.post('/account/logout', isAuthenticated, UserController.revokeToken)

module.exports = router;
