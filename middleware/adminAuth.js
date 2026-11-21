const { admin, db } = require("../config/firebase");

async function adminAuth(req, res, next) {
  try {
    const header = req.headers["x-firebase-auth"] || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const token = header.slice(7);
    const decoded = await admin.auth().verifyIdToken(token);

    const adminDoc = await db
      .collection("admins")
      .doc(decoded.uid)
      .get();

    if (
      !adminDoc.exists ||
      adminDoc.data().role !== "admin" ||
      adminDoc.data().active !== true
    ) {
      return res.status(403).json({
        error: "Admin access denied"
      });
    }

    req.admin = decoded;
    next();

  } catch (error) {
    console.error("Admin authentication error:", error.message);
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
}

module.exports = adminAuth;
