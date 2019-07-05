var express = require("express"),
  app = express(),
  mysql = require("mysql"),
  fs = require("fs"),
  parse = require("csv-parse"),
  async = require("async"),
  multer = require("multer"),
  bodyParser = require("body-parser"),
  exec = require("child_process").exec,
  connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "snapcart"
  });
app.use(bodyParser.urlencoded({ extended: true }));

//Constructing File Name
var filename = Date.now() + ".csv";

// Initializing Total CSV rows
var total_rows = 0;

// Initializing res.send Output Data
var output_array = [];

// Intializing product Availability
var row_availability = 0;

// Primary Key Colname Initialization
var primary_key_colname = "";
//The WHERE part of query
var update_query_id="";
// TO STORE ROW COUNT
var row_counter = 0;

// TO STORE COLUMN HEADER
var col_header = [];

//the input file name
var client_tablename="";

// File Upload Configs
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads");
  },
  filename: function(req, file, cb) {
    cb(null, filename);
  }
});

// Initializing storage to multer
var upload = multer({ storage: storage });

// const express = require("express");
// const app = express();
const port = 3000;

// Constructing complete file path
var inputFile = "uploads/" + filename;

app.post("/snapcart/import/:client_file_tablename", upload.single("filename"), function(
  req,
  res,
  next
) {
  // Get CSV Row Count After Upload
  countFileLines(inputFile);
  row_counter=0;
  client_tablename=req.params.client_file_tablename;
  // Call Import Function
  importData(req, res);
});

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
// CSV ROW COUNTER
function countFileLines(filePath) {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    fs.createReadStream(filePath)
      .on("data", buffer => {
        let idx = -1;
        lineCount--; // Because the loop will run once for idx=-1
        do {
          idx = buffer.indexOf(10, idx + 1);
          lineCount++;
        } while (idx !== -1);
        total_rows = lineCount;
      })
      .on("end", () => {
        resolve(lineCount);
      })
      .on("error", reject);
  });
}

// CSV DATA IMPORT FUNCTION
function importData(req, res) {
  var parser = parse({ delimiter: "," }, function(err, data) {
    async.eachSeries(data, function(line, callback) {
      // do something with the line
      doSomething(line, req, res).then(function() {
        // when processing finishes invoke the callback to move to the next one
        callback();
      });
    });
  });

  fs.createReadStream(inputFile).pipe(parser);
}

// CALLBACK FUNCTION OF CSV ITERATION
async function doSomething(line, req, res) {
  if (row_counter === 0) {
    col_header = line;
  }
  await row_counter++;
  console.log(row_counter+" = "+line);
  if (col_header.length != 0 && row_counter === 1) {
    primary_key_colname = col_header[0];
    // IGNORING THE COLUMN HEADER ROW
  } else if(row_counter > 1) {
    var inserter_query = insertQueryGenerator(line);
    var updater_query = UpdateQueryGenerator(line);
    UploaderLogicFunc(inserter_query,updater_query,line);
    // output_array.push(insert_query);
    // output_array.push(update_query + ";");
    console.log(row_counter+" vs "+total_rows);
    if (row_counter == total_rows) {
        res.send("Import Completed Successfully!!");
    //   res.send(output_array);
    }
  }
}

function UploaderLogicFunc(inserter_query,updater_query,line){
  var id_extracter_query =
      "SELECT COUNT(*) as row_count FROM "+client_tablename+" WHERE id=" + line[0];

    connection.query(id_extracter_query, function(err, row) {
      if (err) {
        throw err;
      }

      row_availability = row[0]["row_count"];
      console.log(row_availability);
      if (row_availability === 1) {
        // console.log(update_query);
        connection.query(updater_query, function(err, rows) {
          if (err) {
            throw err;
          }if (rows.affectedRows > 0) {
            console.log("Row Updated");
          } else {
            res.send("Error!! Please try again.");
          }
        });
      } else {
        connection.query(inserter_query, function(err, rows) {
          if (err) {
            throw err;
          }
          if (rows.affectedRows > 0) {
            console.log("Row Inserted");
          } else {
            res.send("Error!! Please try again.");
          }
        });
      }
    });
}

function insertQueryGenerator(line){
  //CONSTRUCTING INSERT QUERY
  var insert_query =
  "INSERT INTO "+client_tablename+" (" +
  (col_header.join(",")).split(/,(.+)/)[1] +
  ") VALUES(" +
  (line.map(line_row => `'${line_row}'`).join(",")).split(/,(.+)/)[1] +
  ");";
  console.log(insert_query);
  return insert_query;
}

function UpdateQueryGenerator(line){
//CONSTRUCTING UPDATE QUERY
var update_query = "UPDATE testing_tbl SET ";
//console.log(col_header);
for (let col in col_header) {
  if (col_header[col] != primary_key_colname) {
    //console.log("col_header   "+col_header[col]);
    update_query = update_query + col_header[col] + "='" + line[col] + "',";
  } else {
    update_query_id = " WHERE " + primary_key_colname + "=" + line[0];
  }
}
update_query = update_query.slice(0, -1) + update_query_id+" ;";
console.log(update_query);
return update_query;
}
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