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
  res.header("Access-Control-Allow-Origin", "*");
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
app.post("/snapcart", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  var post_query =
    "INSERT INTO products(model,description,sku,upc,ean,jan,isbn,mpn,location,stock_status_id,manufacturer_id,tax_class_id) VALUES('" +
    req.body.model +
    "','" +
    req.body.description +
    "','" +
    req.body.sku +
    "','" +
    req.body.upc +
    "','" +
    req.body.ean +
    "','" +
    req.body.jan +
    "','" +
    req.body.isbn +
    "','" +
    req.body.mpn +
    "','" +
    req.body.location +
    "','" +
    req.body.stock_status_id +
    "','" +
    req.body.maufacturer_id +
    "','" +
    req.body.tax_class_id +
    "')";

  connection.query(post_query, function(err, rows) {
    if (err) {
      throw err;
    }
    if (rows.affectedRows > 0) {
      getLastRow(connection, res);
    } else {
      res.send("The Product has been inserted,Thanks!!");
    }
  });
});

function getLastRow(connection, res) {
  res.header("Access-Control-Allow-Origin", "*");
  connection.query(
    "SELECT * FROM products WHERE product_id = (SELECT MAX(product_id) from products)",
    function(err, rows) {
      if (err) {
        throw err;
      }
      res.send(rows);
    }
  );
}

app.get("/snapcart/products", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  connection.query("SELECT * FROM products", function(err, rows) {
    if (err) {
      throw err;
    }
    res.send(rows);
  });
});

app.get("/snapcart/products/:id", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  console.log(req.params.id);
  connection.query(
    "SELECT * FROM products WHERE product_id=" + req.params.id + ";",
    function(err, rows) {
      if (err) {
        throw err;
      }
      res.send(rows);
    }
  );
});

app.post("/snapcart/products/new", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  var post_query =
    "INSERT INTO products(model,description,sku,upc,ean,jan,isbn,mpn,location,stock_status_id,manufacturer_id,tax_class_id) VALUES('" +
    req.body.model +
    "','" +
    req.body.description +
    "','" +
    req.body.sku +
    "','" +
    req.body.upc +
    "','" +
    req.body.ean +
    "','" +
    req.body.jan +
    "','" +
    req.body.isbn +
    "','" +
    req.body.mpn +
    "','" +
    req.body.location +
    "','" +
    req.body.stock_status_id +
    "','" +
    req.body.maufacturer_id +
    "','" +
    req.body.tax_class_id +
    "')";

  connection.query(post_query, function(err, rows) {
    if (err) {
      throw err;
    }
    if (rows.affectedRows > 0) {
      getLastRow(connection, res);
    } else {
      res.send("The Product has been inserted,Thanks!!");
    }
  });
});

app.put("/snapcart/products/:id/edit", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");

// var update_query="UPDATE `products` SET `model` = '"+req.body.model+"', `description` = '"+req.body.description+"', `sku` = '"+req.body.sku+"', `upc` = '"+req.body.upc+"', `ean` = '"+req.body.ean+"', `jan` = '"+req.body.jan+"', `isbn` = '"+req.body.isbn+"', `mpn` = '"+req.body.mpn+"', `location` = '"+req.body.location+"', `stock_status_id` = '"+req.body.stock_status_id+"', `manufacturer_id` = '"+req.body.manufacturer_id+"', `tax_class_id` = '"+req.body.tax_class_id+"'WHERE product_id="+req.params.id+";";

  var content = req.body;
  var content_lenght = Object.keys(content).length;
  if (content_lenght > 0) {
    var update_query = "UPDATE products SET ";
    Object.entries(content).forEach(([key, value]) => {
      if (typeof value !== "undefined") {
        update_query += key + "='" + value + "',";
      }
    });
    update_query = update_query.slice(0, -1);
    update_query += " WHERE product_id=" + req.params.id;
  }

  connection.query(update_query, function(err, rows) {
    if (err) {
      throw err;
    }
    if (rows.affectedRows > 0) {
      connection.query(
        "SELECT * FROM products WHERE product_id = " + req.params.id + " ;",
        function(err, rows) {
          if (err) {
            throw err;
          }
          res.send(rows);
        }
      );
    } else {
      res.send("The Product has not been updated,Sorry!!");
    }
  });
});

app.delete("/snapcart/products/:id/delete", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  var del_query =
    "DELETE FROM `products` WHERE product_id=" + req.params.id + ";";
  //console.log(del_query)
  connection.query(del_query, function(err, rows) {
    if (err) {
      throw err;
    }
    res.send("The Product has been deleted,Thanks!!");
  });
});

//Get the details of all the products that belong to a particular person
app.get("/snapcart/products/vendor/:Mid", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  var vend_query =
    "SELECT * FROM products WHERE manufacturer_id = " + req.params.Mid + " ;";
  connection.query(vend_query, function(err, rows) {
    if (err) {
      throw err;
    }
    res.send(rows);
  });
});

app.get("/snapcart/customer",function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  connection.query("SELECT * FROM customer", function(err, rows) {
    if (err) {
      throw err;
    }
    res.send(rows);
  });
});


app.get("/snapcart/customer/:Cid",function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  console.log(req.params.Cid);
  connection.query(
    "SELECT * FROM customer WHERE customer_id=" + req.params.Cid + ";",
    function(err, rows) {
      if (err) {
        throw err;
      }
      res.send(rows);
    }
  );
});

app.post("/snapcart/customer/new",function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  let post1_query =
    "INSERT INTO customer(store_id,language_id,firstname,lastname,email,telephone,fax,password,salt,cart,wishlist,newsletter,address_id,custom_field,ip,status,safe,token,code,date_added) VALUES('" +
    req.body.store_id +
    "','" +
    req.body.language_id +
    "','" +
    req.body.firstname +
    "','" +
    req.body.lastname +
    "','" +
    req.body.email +
    "','" +
    req.body.telephone +
    "','" +
    req.body.fax +
    "','" +
    req.body.password +
    "','" +
    req.body.salt +
    "','" +
    req.body.cart +
    "','" +
    req.body.wishlist +
    "','" +
    req.body.newsletter +
    "','" +
    req.body.address_id +
    "','" +
    req.body.custom_field +
    "','" +
    req.body.ip +
    "','" +
    req.body.status +
    "','" +
    req.body.safe +
    "','" +
    req.body.taken +
    "','" +
    req.body.code +
    "','" +
    req.body.date_added +
    "')";

  connection.query(post1_query, function(err, rows) {
    if (err) {
      throw err;
    }
    if (rows.affectedRows > 0) {
      getLastRow_Customer(connection, res);
    } else {
      res.send("The Customer details was not inserted,Sorry!!");
    }
  });
});
function getLastRow_Customer(connection, res) {
  res.header("Access-Control-Allow-Origin", "*");
  connection.query(
    "SELECT * FROM customer WHERE customer_id = (SELECT MAX(customer_id) from customer)",
    function(err, rows) {
      if (err) {
        throw err;
      }
      res.send(rows);
    }
  );
}

app.put("/snapcart/customer/:id/edit",function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  var content = req.body;
  var content_lenght = Object.keys(content).length;
  if (content_lenght > 0) {
    var update_query = "UPDATE customer SET ";
    Object.entries(content).forEach(([key, value]) => {
      if (typeof value !== "undefined") {
        update_query += key + "='" + value + "',";
      }
    });
    update_query = update_query.slice(0, -1);
    update_query += " WHERE customer_id=" + req.params.id;
  }

  connection.query(update_query, function(err, rows) {
    console.log(update_query)
    if (err) {
      throw err;
    }
    if (rows.affectedRows > 0) {
      connection.query(
        "SELECT * FROM customer WHERE customer_id = " + req.params.id + " ;",
        function(err, rows) {
          if (err) {
            throw err;
          }
          res.send(rows);
        }
      );
    } else {
      res.send("The Customer details were not updated,Sorry!!");
    }
  });
});

app.delete("/snapcart/customer/:id/delete", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  var del_query =
    "DELETE FROM `customer` WHERE customer_id=" + req.params.id + ";";
  //console.log(del_query)
  connection.query(del_query, function(err, rows) {
    if (err) {
      throw err;
    }
    res.send("The Customer credentials has been deleted,Thanks!!");
  });
});

app.post("/snapcart/orders/new",function(req,res){
  res.header("Access-Control-Allow-Origin", "*");

  var get_order_schema = "desc `order`";

  connection.query(get_order_schema, async function(err, rows) {
    if (err) {
      throw err;
    }

    //Constructing order column names for insert query
    const order_cols = [];
    for(let row of rows){
      await order_cols.push(row['Field']);
    }
    var order_cols_data = "(";
    for(let order_col of order_cols){
      order_cols_data += order_col+","
    }
    order_cols_data = order_cols_data.slice(0, -1);
    order_cols_data += ") ";

    //Constructing order column names for insert query
    const order_values = [];
    var content = req.body;
    var content_lenght = Object.keys(content).length;
    if (content_lenght > 0) {
      var order_cols_value = "VALUES(";
      Object.entries(content).forEach(([key, value]) => {
        if (typeof value !== "undefined") {
          
          if(value.length > 0){
            order_cols_value += "'"+value+"'"+","
          }
          else{
            order_cols_value += "'0',"
          }
        }
      });
      order_cols_value = order_cols_value.slice(0, -1);
      order_cols_value += ")";
      
      
    }

    var post_query = "INSERT INTO `order` "+ order_cols_data+ order_cols_value+" ;";
    console.log(post_query);
    connection.query(post_query, function(err, rows) {
      if (err) {
        throw err;
      }
      if (rows.affectedRows > 0) {
        getLastRow_order(connection, res);
      } else {
        res.send("The Order has been placed,Thanks!!");
      }
    });
  });
});
function getLastRow_Order(connection, res) {
  res.header("Access-Control-Allow-Origin", "*");
  connection.query(
    "SELECT * FROM order WHERE order_id = (SELECT MAX(order_id) from order)",
    function(err, rows) {
      if (err) {
        throw err;
      }
      res.send(rows);
    }
  );
}

app.get("/snapcart/orders",function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  connection.query("SELECT * FROM `order`", function(err, rows) {
    if (err) {
      throw err;
    }
    res.send(rows);
  });
});

app.get("/snapcart/orders/:Oid",function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  console.log(req.params.Oid);
  var qery="SELECT * FROM `order` WHERE order_id=" + req.params.Oid + ";";
  console.log(qery);
  connection.query(
    qery,
    function(err, rows) {
      if (err) {
        throw err;
      }
      res.send(rows);
    }
  );
});
//listening at port 3000
app.listen(3000, "localhost", function() {
  console.log("The Snapcart Server Has Started");
});
