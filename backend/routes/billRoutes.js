const express = require('express');
const router = express.Router();
const { getBills, createDraftBill, updateBill, deleteBill } = require('../controllers/billController');

router.get('/', getBills);
router.post('/', createDraftBill);
router.put('/:id', updateBill);
router.delete('/:id', deleteBill);

module.exports = router;