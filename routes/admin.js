const express = require('express');
const router = express.Router();
const {createField,removeField,createVenue,removeVenue,
    createPromotion,deletePromotion,getPromotionById,updatePromotion,getAllPromotion,
    getAllTeams,adminCreateTeam,deleteTeam,
    getAllUsers,getUserById, deleteUser,resetPassword,
    getAllBooking
 } = require('../controllers/adminController');
const {registerUser}=require('../controllers/userController');
const verifyToken = require('../utils/vertifyToken');
const checkAdminRole = require('../utils/checkAdminRole');
//quan lý sân
router.post('/field', verifyToken,checkAdminRole,createField);
router.delete('/field/:fieldId', verifyToken,checkAdminRole,removeField);
// địa điểm sân
router.post('/venue', verifyToken,checkAdminRole,createVenue);
router.delete('/venue/:venueId', verifyToken,checkAdminRole,removeVenue);
//promotion
router.post('/promotion', verifyToken,checkAdminRole,createPromotion);
router.put('/promotion/:id', verifyToken,checkAdminRole,updatePromotion);
router.delete('/promotion/:id', verifyToken,checkAdminRole,deletePromotion);
router.get('/promotion', verifyToken,checkAdminRole,getAllPromotion);
router.get('/promotion/:id', verifyToken,checkAdminRole,getPromotionById);
//user
router.get('/user',verifyToken,checkAdminRole,getAllUsers);
router.get('/user/:id',verifyToken,checkAdminRole,getUserById);
router.post('/user',verifyToken,checkAdminRole,registerUser);
router.patch('/user/:id',verifyToken,checkAdminRole,resetPassword);
router.delete('/user/:id',verifyToken,checkAdminRole,deleteUser);
//
router.get('/team',verifyToken,checkAdminRole,getAllTeams);
router.post('/team',verifyToken,checkAdminRole,adminCreateTeam);
router.delete('/team/:teamId',verifyToken,checkAdminRole,deleteTeam);
//
router.get('/booking',verifyToken,checkAdminRole,getAllBooking)

//report

module.exports = router;