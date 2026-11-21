const router = require("express").Router();
const controller = require("../controllers/orderController");
const customerAuth = require("../middleware/customerAuth");
const adminAuth = require("../middleware/adminAuth");

router.post("/", customerAuth, controller.create);
router.get("/mine", customerAuth, controller.mine);

router.get("/", adminAuth, controller.listAll);
router.patch("/:orderId/status", adminAuth, controller.updateStatus);

module.exports = router;
