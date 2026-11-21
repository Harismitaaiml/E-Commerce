const { admin } = require("../config/firebase");

async function customerAuth(req, res, next) {
  try {
    const header = req.headers["x-firebase-auth"] || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = await admin.auth().verifyIdToken(header.slice(7));
    req.customer = decoded;
    next();
  } catch (error) {
    console.error("Customer authentication error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = customerAuth;
