const r = require("express").Router();
const c = require("../controllers/productController");
const adminAuth = require("../middleware/adminAuth");

r.get("/", c.list);
r.get("/:productId", c.get);

// Product changes are restricted to active Firestore administrators.
r.post("/", adminAuth, c.create);
r.put("/:productId", adminAuth, c.update);
r.patch("/:productId/status", adminAuth, c.setStatus);
r.delete("/:productId", adminAuth, c.remove);

module.exports = r;
