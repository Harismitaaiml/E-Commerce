require("dotenv").config();
const express=require("express"), cors=require("cors"), helmet=require("helmet");
const {db}=require("./config/firebase");
const app=express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.gstatic.com", "https://code.jquery.com"],
      connectSrc: [
        "'self'",
        "https://firestore.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "https://www.googleapis.com",
        "https://firebaseinstallations.googleapis.com", "https://ssh.cloud.google.com"
      ],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"]
    }
  }
}));
app.use(cors({origin:process.env.CORS_ORIGIN?process.env.CORS_ORIGIN.split(","):true}));
app.use(express.json({limit:"1mb"}));
app.use(express.static("public"));
app.get("/hobby-api/health",async(_req,res)=>{try{await db.collection("products").limit(1).get();res.json({ok:true,service:"hobbyhub-api",firestore:"connected"});}catch(e){res.status(503).json({ok:false,error:"Firestore unavailable"});}});
app.use("/hobby-api/admin", require("./routes/adminRoutes"));
app.use("/hobby-api/products",require("./routes/productRoutes"));
app.use("/hobby-api/customers",require("./routes/customerRoutes"));
app.use("/hobby-api/orders",require("./routes/orderRoutes"));
app.use((req,res)=>res.status(404).json({error:"Route not found"}));
app.use((err,req,res,next)=>{console.error(err);res.status(err.status||500).json({error:err.publicMessage||"Internal server error"});});
const port=Number(process.env.PORT||8080);app.listen(port,()=>console.log(`HobbyHub API listening on ${port}`));
