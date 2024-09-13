const express = require('express');
const router = express.Router();
const {createField,removeField,createVenue,removeVenue,
    createPromotion,deletePromotion,getPromotionById,updatePromotion,getAllPromotion
 } = require('../controllers/adminController');
const verifyToken = require('../utils/vertifyToken');
const checkAdminRole = require('../utils/checkAdminRole');
//quan lý sân

router.post('/field/create', verifyToken,checkAdminRole,createField);
router.delete('/field/remove', verifyToken,checkAdminRole,removeField);
// địa điểm sân
router.post('/venue/create', verifyToken,checkAdminRole,createVenue);
router.delete('/venue/remove', verifyToken,checkAdminRole,removeVenue);
//promotion
router.post('/promotion', verifyToken,checkAdminRole,createPromotion);
router.put('/promotion/:id', verifyToken,checkAdminRole,updatePromotion);
router.delete('/promotion/:id', verifyToken,checkAdminRole,deletePromotion);
router.get('/promotion', verifyToken,checkAdminRole,getAllPromotion);
router.get('/promotion/:id', verifyToken,checkAdminRole,getPromotionById);

module.exports = router;