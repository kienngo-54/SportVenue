const express = require('express');
const router = express.Router();
const { registerUser,loginUser,getUserInfo,changePass,addOrUpdateAddress,addOrUpdatePhoneNumber,updateUserName,
  createTeam,addMember,removeMember,getTeamInfo,
  searchField,
  searchEquipment,
  searchReferee,
  searchTrainer,
  createBooking,
  sendMatchRequest, getMatchRequests,respondToMatchRequest} = require('../controllers/userController');
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
router.patch('/team/:id',verifyToken,addMember);
router.delete('/team/:id',verifyToken,removeMember);
router.get('/team',verifyToken,getTeamInfo);
//field
router.get('/field',verifyToken,searchField);
router.get('/equipment',verifyToken,searchEquipment);
router.get('/referee',verifyToken,searchReferee);
router.get('/trainer',verifyToken,searchTrainer);
//booking
router.post('/booking',verifyToken,createBooking);
//matching
router.post('/matching',verifyToken, sendMatchRequest);
router.get('/matching',verifyToken, getMatchRequests);
router.patch('/matching',verifyToken, respondToMatchRequest);
module.exports = router;