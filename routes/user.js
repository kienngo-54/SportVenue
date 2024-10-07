const express = require('express');
const router = express.Router();
const { registerUser,loginUser,getUserInfo,changePass,addOrUpdateAddress,addOrUpdatePhoneNumber,updateUserName,
  createTeam,addMember,removeMember,getTeamInfo,updateTeam,
  searchField,
  searchEquipment,
  searchReferee,
  searchTrainer,
  createBooking,getBooking,
  sendMatchRequest, getMatchRequests,respondToMatchRequest,
  createOrder,captureOrder} = require('../controllers/userController');
const verifyToken = require('../utils/vertifyToken');
//user
router.post('/register', registerUser);
router.post('/login',loginUser);
router.get('/me',verifyToken,getUserInfo);
router.patch('/phone', verifyToken, addOrUpdatePhoneNumber);
router.patch('/address', verifyToken, addOrUpdateAddress);
router.patch('/name', verifyToken, updateUserName);
router.patch('/changepassword',verifyToken,changePass);
//team
router.post('/team',verifyToken,createTeam);
router.patch('/team',verifyToken,addMember);
router.delete('/team',verifyToken,removeMember);
router.get('/team',verifyToken,getTeamInfo);
router.put('/team',verifyToken,updateTeam);
//field
router.get('/field',verifyToken,searchField);
router.get('/equipment',verifyToken,searchEquipment);
router.get('/referee',verifyToken,searchReferee);
router.get('/trainer',verifyToken,searchTrainer);
//booking
router.post('/booking',verifyToken,createBooking);
router.get('/booking',verifyToken,getBooking);
//matching
router.post('/matching',verifyToken, sendMatchRequest);
router.get('/matching',verifyToken, getMatchRequests);
router.patch('/matching',verifyToken, respondToMatchRequest);
//payment
router.post('/payment',verifyToken,createOrder);
router.post('/payment/capture',verifyToken,captureOrder);
module.exports = router;