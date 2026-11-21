const admin=require("firebase-admin");
if(!admin.apps.length) admin.initializeApp({projectId:process.env.GOOGLE_CLOUD_PROJECT||"hobby-site-f8f72"});
const db=admin.firestore();
module.exports={admin,db};
