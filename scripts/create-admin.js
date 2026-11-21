const admin = require("firebase-admin");

admin.initializeApp({ projectId: "hobby-site-f8f72" });

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.length < 6) {
    throw new Error("Valid ADMIN_EMAIL and ADMIN_PASSWORD required");
  }

  let user;

  try {
    user = await admin.auth().getUserByEmail(email);
    console.log("Existing Authentication user found.");
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;

    user = await admin.auth().createUser({
      email,
      password,
      displayName: "HobbyHub Admin"
    });
  }

  await admin.firestore().collection("admins").doc(user.uid).set({
    displayName: "HobbyHub Admin",
    email: user.email,
    role: "admin",
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log("ADMIN CREATED SUCCESSFULLY");
  console.log("UID:", user.uid);
  console.log("EMAIL:", user.email);
}

createAdmin().catch(error => {
  console.error("FAILED:", error.message);
  process.exit(1);
});
