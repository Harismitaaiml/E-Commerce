const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");

router.get("/verify", adminAuth, (req, res) => {
    res.json({
        success: true,
        message: "Admin authenticated successfully",
        uid: req.admin.uid,
        email: req.admin.email,
        role: "admin"
    });
});

module.exports = router;
