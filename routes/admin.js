const express = require('express');
const router = express.Router();
const {createField,removeField } = require('../controllers/adminController');
const verifyToken = require('../utils/vertifyToken');
const checkAdminRole = require('../utils/checkAdminRole');
//quan lý sân

router.post('/field/create', verifyToken,checkAdminRole,createField);
router.delete('/field/remove', verifyToken,checkAdminRole,removeField);
module.exports = router;