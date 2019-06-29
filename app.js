var express = require("express"),
  app = express(),
  mysql = require("mysql"),
  bodyParser = require("body-parser"),
  connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "snapcart"
  });

// connection.connect();

app.use(bodyParser.urlencoded({ extended: true }));

// Get Products and Search Products
app.get("/snapcart", function(req, res) {
  var limit = req.query.limit; //either a value or 'undefined'
  var last_id = req.query.last_id;
  var keyword = req.query.keyword;

  if (typeof last_id !== "undefined") {
    var last_id_cond = "AND product_id > " + last_id + " ";
  } else {
    var last_id_cond = " ";
  }
  if (typeof keyword !== "undefined") {
    var keyword_cond = "AND name LIKE '%" + keyword + "%' ";
  } else {
    var keyword_cond = " ";
  }
  if (typeof limit !== "undefined") {
    var limit_cond = "LIMIT " + limit;
  } else {
    var limit_cond = " ";
  }

  var query =
    "SELECT * FROM products WHERE 1=1 " +
    last_id_cond +
    keyword_cond +
    "ORDER BY product_id DESC " +
    limit_cond;
  console.log(query);

  connection.query(query, [], function(err, rows, fields) {
    if (err) {
      throw err;
    }
    res.send(rows);
  });

  // res.send(query);
});

// Add New Products
  app.post("/snapcart",function(req,res){
    var post_query="INSERT INTO products(model,description,sku,upc,ean,jan,isbn,mpn,location,stock_status_id,manufacturer_id,tax_class_id) VALUES('"+req.body.model+"','"+req.body.description+"','"+req.body.sku+"','"+req.body.upc+"','"+req.body.ean+"','"+req.body.jan+"','"+req.body.isbn+"','"+req.body.mpn+"','"+req.body.location+"','"+req.body.stock_status_id+"','"+req.body.maufacturer_id+"','"+req.body.tax_class_id+"')"

    connection.query(post_query,function(err, rows) {
      if (err) {
        throw err;
      }
      if(rows.affectedRows > 0){
          getLastRow(connection,res)
      }
      else{
        res.send("The Product has been inserted,Thanks!!")
      }
      
    });
  })

 function getLastRow(connection,res){
  connection.query("SELECT * FROM products WHERE product_id = (SELECT MAX(product_id) from products)",function(err,rows){
    if(err){
      throw err;
    }
    res.send(rows)
  })
 }

 app.get("/snapcart/products",function(req,res){
  connection.query("SELECT * FROM products",function(err,rows){
    if(err){
      throw err;
    }
    res.send(rows)
  })
 })

 app.get("/snapcart/products/:id",function(req,res){
   console.log(req.params.id)
   connection.query("SELECT * FROM products WHERE product_id="+req.params.id+";",function(err,rows){
     if(err){
       throw err
     }
     res.send(rows)
   });
 })

 app.post("/snapcart/products/new",function(req,res){
  var post_query="INSERT INTO products(model,description,sku,upc,ean,jan,isbn,mpn,location,stock_status_id,manufacturer_id,tax_class_id) VALUES('"+req.body.model+"','"+req.body.description+"','"+req.body.sku+"','"+req.body.upc+"','"+req.body.ean+"','"+req.body.jan+"','"+req.body.isbn+"','"+req.body.mpn+"','"+req.body.location+"','"+req.body.stock_status_id+"','"+req.body.maufacturer_id+"','"+req.body.tax_class_id+"')"

  connection.query(post_query,function(err, rows) {
    if (err) {
      throw err;
    }
    if(rows.affectedRows > 0){
        getLastRow(connection,res)
    }
    else{
      res.send("The Product has been inserted,Thanks!!")
    }
    
  });
 })

 app.put("/snapcart/products/:id/edit",function(req,res){

  // var update_query="UPDATE `products` SET `model` = '"+req.body.model+"', `description` = '"+req.body.description+"', `sku` = '"+req.body.sku+"', `upc` = '"+req.body.upc+"', `ean` = '"+req.body.ean+"', `jan` = '"+req.body.jan+"', `isbn` = '"+req.body.isbn+"', `mpn` = '"+req.body.mpn+"', `location` = '"+req.body.location+"', `stock_status_id` = '"+req.body.stock_status_id+"', `manufacturer_id` = '"+req.body.manufacturer_id+"', `tax_class_id` = '"+req.body.tax_class_id+"'WHERE product_id="+req.params.id+";";
  
  var content=req.body;
  var content_lenght = Object.keys(content).length;
  if(content_lenght>0){
    var update_query="UPDATE products SET ";
    Object.entries(content).forEach(([key, value]) => {
      if(typeof(value)!=='undefined'){
        update_query+=key+"='"+value+"',";
      }
    });
    update_query = update_query.slice(0, -1);
    update_query+=" WHERE product_id="+req.params.id;
  }
 
  connection.query(update_query,function(err, rows) {
    if (err) {
      throw err;
    }
    if(rows.affectedRows > 0){
      connection.query("SELECT * FROM products WHERE product_id = "+req.params.id+" ;",function(err,rows){
        if(err){
          throw err;
        }
        res.send(rows)
      })
    }
    else{
      res.send("The Product has not been updated,Sorry!!")
    }
    
  });
 })

 app.delete("/snapcart/products/:id/delete",function(req,res){
   var del_query="DELETE FROM `products` WHERE product_id="+req.params.id+";"
   //console.log(del_query)
  connection.query(del_query,function(err, rows) {
    if (err) {
      throw err;
    }
    res.send("The Product has been deleted,Thanks!!");
  });
 })

 //Get the details of all the products that belong to a particular person
 app.get("/snapcart/products/vendor/:Mid",function(req,res){
   var vend_query = "SELECT * FROM products WHERE manufacturer_id = "+req.params.Mid+" ;"
   connection.query(vend_query,function(err,rows){
     if(err){
       throw err
     }
     res.send(rows)
   })
 })
 
//listening at port 3000
app.listen(3000, "localhost", function() {
  console.log("The Snapcart Server Has Started");
});