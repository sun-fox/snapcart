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
    connection.query(query, [], function(err, rows, fields) {
    if (err) {
      throw err;
    }
    res.send(rows);
  });
});

app.get("/snapcart/:tblName", function(req, res) {
  getAll(res,req.params.tblName);
});

app.get("/snapcart/:tblName/:col_name/:id", function(req, res) {
  getSpecific(req,res,req.params.tblName,req.params.col_name);
});

app.post("/snapcart/:tblName/:id_col_name/new",function(req,res){
  addItem(res,req,req.params.tblName,req.params.id_col_name);
});

app.put("/snapcart/:tblName/:col_name/:id/edit", function(req, res) {
  item_update(req,res,req.params.tblName,req.params.col_name);
});

app.delete("/snapcart/:tblName/:col_name/:id/delete", function(req, res) {
  item_delete(req,res,req.params.tblName,req.params.col_name);
});

//listening at port 3000
app.listen(3000, "localhost", function() {
  console.log("The Snapcart Server Has Started");
});

//MODULAR FUNCTIONS
//Functions making code modular

//gets the items present in the table
function getAll(res,table_name){
  res.header("Access-Control-Allow-Origin", "*");
  connection.query("SELECT * FROM `"+table_name+"` ;", function(err, rows) {
    if (err) {
      throw err;
    }
    res.send(rows);
  });
}

//gets a specific item in a specific table
function getSpecific(req,res,table_name,item_name_id){
  res.header("Access-Control-Allow-Origin", "*");
  connection.query(
    "SELECT * FROM `"+table_name+"` WHERE "+item_name_id+" = " + req.params.id + " ;",
    function(err, rows) {
      if (err) {
        throw err;
      }
      res.send(rows);
    }
  );
}

//Gets the last row of from table passed and corresponding to the item ID as the judgemnet criteria.
function getLastRow(res,table_name,item_id) {
  res.header("Access-Control-Allow-Origin", "*");
  connection.query(
    "SELECT * FROM `"+table_name+"` WHERE "+item_id+" = (SELECT MAX("+item_id+") from `"+table_name+"`)",
    function(err, rows) {
      if (err) {
        throw err;
      }
      res.send(rows);
    }
  );
}

function addItem(res,req,tblName,id_col_name){
  res.header("Access-Control-Allow-Origin", "*");
  var data = req.body;
  var colNames = [];
  var colValues = [];
  Object.keys(data).forEach(function(key) {
    colNames.push(key);
    colValues.push(data[key]?"'"+data[key]+"'":"''");
  });
  var insertQuery = "INSERT INTO `"+tblName+"` ("+colNames.join(',')+") VALUES("+colValues.join(",")+");";
  connection.query(
    insertQuery,
    function(err, rows) {
      if (err) {
        throw err;
      }
      if (rows.affectedRows > 0) {
        getLastRow(res,tblName,id_col_name);
      } else {
        res.send("Error!! Please try again.");
      }
      
    }
  );
}

function item_update(req,res,table_name,item_id){
  res.header("Access-Control-Allow-Origin", "*");
  var content = req.body;
  var content_lenght = Object.keys(content).length;
  if (content_lenght > 0) {
    var update_query = "UPDATE `"+table_name+"` SET ";
    Object.entries(content).forEach(([key, value]) => {
      if (typeof value !== "undefined") {
        update_query += key + "='" + value + "',";
      }
    });
    update_query = update_query.slice(0, -1);
    update_query += " WHERE "+item_id+" =" + req.params.id;
  }

  connection.query(update_query, function(err, rows) {
    if (err) {
      throw err;
    }
    if (rows.affectedRows > 0) {
      connection.query(
        "SELECT * FROM `"+table_name+"` WHERE "+item_id+" = " + req.params.id + " ;",
        function(err, rows) {
          if (err) {
            throw err;
          }
          res.send(rows);
        }
      );
    } else {
      res.send("The `"+table_name+"` has not been updated,Sorry!!");
    }
  });
}

function item_delete(req,res,table_name,item_id){
  res.header("Access-Control-Allow-Origin", "*");
  var del_query =
    "DELETE FROM `"+table_name+"` WHERE "+item_id+" =" + req.params.id + ";";
  connection.query(del_query, function(err, rows) {
    if (err) {
      throw err;
    }
    res.send("The `"+table_name+"` credentials has been deleted,Thanks!!");
  });
}
