const r=require("express").Router(),c=require("../controllers/productController");
r.get("/",c.list);r.get("/:productId",c.get);module.exports=r;
