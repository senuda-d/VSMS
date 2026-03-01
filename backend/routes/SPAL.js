import express from "express";
import {
  getSPALs,
  getSPALById,
  createSPAL,
  updateSPAL,
  deleteSPAL
} from "../controllers/SPALController.js";

const router = express.Router();

/* GET ALL */
router.get("/", getSPALs);

/* GET SINGLE */
router.get("/:id", getSPALById);

/* CREATE */
router.post("/", createSPAL);

/* UPDATE */
router.patch("/:id", updateSPAL);

/* DELETE */
router.delete("/:id", deleteSPAL);

export default router;