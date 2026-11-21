const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "hobby-site-f8f72"
});

const db = admin.firestore();

async function migrateAdmin() {
  const uid = process.env.ADMIN_UID;
  const email = process.env.ADMIN_EMAIL;
  const displayName = process.env.ADMIN_NAME || "HobbyHub Admin";

  if (!uid || !email) {
    throw new Error(
      "Set ADMIN_UID and ADMIN_EMAIL before running migration."
    );
  }

  const adminRef = db.collection("admins").doc(uid);

  const adminData = {
    displayName,
    email,
    role: "admin",
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await adminRef.set(adminData, { merge: true });

  console.log("SUCCESS: Admin profile migrated to Firestore.");
  console.log("Collection: admins");
  console.log("Document ID:", uid);
}

migrateAdmin()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("MIGRATION FAILED:", error.message);
    process.exit(1);
  });
