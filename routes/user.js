const express = require('express');
const router = express.Router();
const { registerUser,loginUser,getUserInfo,changePassword,addOrUpdateAddress,addOrUpdatePhoneNumber,updateUserName,createTeam,addMember,removeMember,getTeamInfo} = require('../controllers/userController');
const verifyToken = require('../utils/vertifyToken');
//user
router.post('/register', registerUser);
router.post('/login',loginUser);
router.get('/me',verifyToken,getUserInfo);
router.patch('/phone', verifyToken, addOrUpdatePhoneNumber);
router.patch('/address', verifyToken, addOrUpdateAddress);
router.patch('/name', verifyToken, updateUserName);

router.post('/changepassword',verifyToken,changePassword);
//team
router.post('/team/create',verifyToken,createTeam);
router.patch('/team/members',verifyToken,addMember);
router.delete('/team/members',verifyToken,removeMember);
router.get('/team',verifyToken,getTeamInfo);
//field




/*router.post('/login', authenticate, (req, res) => {
  res.json({ message: 'Logged in successfully' });
});

router.get('/me', authorize, (req, res) => {
  res.json(req.user);
});*/
module.exports = router;