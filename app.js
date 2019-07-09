var express = require("express"),
  app = express(),
  mysql = require("mysql"),
  fs = require("fs"),
  parse = require("csv-parse"),
  async = require("async"),
  multer = require("multer"),
  bodyParser = require("body-parser"),
  exec = require("child_process").exec,
  connection;

function estblish_connec(db_name) {
  connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: db_name
  });
}

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
var update_query_id = "";
// TO STORE ROW COUNT
var row_counter = 0;

// TO STORE COLUMN HEADER
var col_header = [];

//the input file name
var client_tablename = "";

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

// Constructing complete file path
var inputFile = "uploads/" + filename;

//Token declaration and initialization globaly
var token = "";
var bcrypt = require("bcrypt");
const saltRounds = 10;
var password_hash = "";

app.post("/:db_name/register", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  estblish_connec(req.params.db_name);
  console.log(req.body);
  require("crypto").randomBytes(48, function(err, buffer) {
    token = buffer.toString("hex");
  });
  let is_user_exist =
    "SELECT count(*) as user_count from user WHERE username='" +
    req.body.username +
    "';";
  connection.query(is_user_exist, function(err, rows, fields) {
    if (err) throw err;

    if (rows[0].user_count == 0) {
      console.log("User not present");
      bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if (err) {
          console.log("Hashing of password Unsuccesful");
        }
        // Storeing hash in password DB.
        password_hash = hash;
        console.log("hash 1: " + password_hash);
        // CREATE NEW USER IF NOT EXISTS
        let create_user =
          "INSERT INTO user(firstname,lastname,username,password_hash,token) VALUES('" +
          req.body.firstname +
          "','" +
          req.body.lastname +
          "','" +
          req.body.username +
          "','" +
          password_hash +
          "','" +
          token +
          "');";

        connection.query(create_user, function(err, rows, fields) {
          if (err) throw err;
          if (rows.affectedRows == 1) {
            console.log("User logged in successfully!");
            //GET LAST INSERTED ID FROM USER TABLE
            connection.query("SELECT MAX(id) as max_id from user", function(
              err,
              rows,
              fields
            ) {
              if (err) throw err;
              if (rows[0].max_id) {
                // LOGIN THE USER
                connection.query(
                  "SELECT * from user where id=" + rows[0].max_id,
                  function(err, rows, fields) {
                    if (err) throw err;
                    res.send(rows[0]);
                  }
                );
              } else {
                res.send("Error!");
              }
            });
          } else {
            res.send("Error!");
          }
        });
      });
    } else {
      res.send("User already present");
    }
  });
});

app.post("/:db_name/login", function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  estblish_connec(req.params.db_name);
  let user = req.body;
  console.log(user);
  if (
    !req.body.password ||
    req.body.password === "" ||
    req.body.username === ""
  ) {
    res.send("Please input password or username ");
  } else {
    let user_search_result =
      "SELECT COUNT(*) AS user_count FROM user WHERE username='" +
      user.username +
      "';";
    connection.query(user_search_result, function(err, rows) {
      console.log(rows);
      if (err) {
        throw err;
      } else if (rows[0].user_count === 1) {
        let flag = false;
        connection.query(
          "SELECT * FROM user WHERE username='" + user.username + "';",
          async function(err, rows) {
            console.log(rows[0].password_hash);

            await bcrypt.compare(
              req.body.password,
              rows[0].password_hash,
              function(err, res) {
                if (err) {
                  // res.sendStatus(401);
                  console.log("error in hashing: " + error);
                } else if (res) {
                  flag = true;
                  console.log("hashing Verified Correctly: " + flag);
                  token = rows[0].token;
                  // res.send("You are successfully logged in :\n"+rows);
                } else {
                  flag=false;
                  console.log("Wrong Username or password.");
                  // res.send("Unauthorised");
                }
              }
            );
            setTimeout(function() {
              console.log("passwordcorrect=" + flag);
              if (flag === true) {
                res.send(rows);
              } else {
                res.sendStatus(401);
                console.log("Username or Password is incorrect");
              }
            }, 200);
          }
        );
      } else {
        console.log("Your username does'nt exist.");
        res.sendStatus(403);
      }
    });
  }
});

app.post(
  "/:db_name/import/:client_file_tablename",
  upload.single("filename"),
  function(req, res) {
    // console.log("route was hit");
    console.log("header: " + req.body.token);
    console.log(token);
    if (req.body.token === token) {
      console.log("connection being established");
      estblish_connec(req.params.db_name);
      // Get CSV Row Count After Upload
      countFileLines(inputFile);
      row_counter = 0;
      client_tablename = req.params.client_file_tablename;
      // Call Import Function
      importData(req, res);
    } else {
      res.sendStatus(401);
    }
  }
);

//array to store the details of all the items in the datalist
var dataList = [];
var headers = [];
app.get("/:db_name/export/:client_file_tablename", function(req, res) {
  if (req.headers.token === token) {
    res.header("Access-Control-Allow-Origin", "*");
    estblish_connec(req.params.db_name);
    var export_query =
      "SELECT `COLUMN_NAME` FROM `INFORMATION_SCHEMA`.`COLUMNS` WHERE `TABLE_SCHEMA` = '" +
      req.params.db_name +
      "' AND `TABLE_NAME` = '" +
      req.params.client_file_tablename +
      "'";
    console.log(export_query);
    connection.query(export_query, function(err, rows) {
      if (err) {
        throw err;
      }
      let data = rows;
      for (var i = 0; i < data.length; i++) {
        headers.push(data[i].COLUMN_NAME);
      }
      //console.log(headers);

      connection.query(
        "SELECT * FROM `" + req.params.client_file_tablename + "` ;",
        function(err, rows) {
          if (err) {
            throw err;
          }
          // console.log(rows)

          for (var i = 0; i < rows.length; i++) {
            dataList.push(Object.assign({}, rows[i]));
          }

          setTimeout(() => {
            //console.log(dataList);
            res.writeHead(200, {
              "Content-Type": "text/csv",
              "Content-Disposition":
                "attachment; filename=" +
                req.params.client_file_tablename +
                ".csv"
            });
            // whereas this part is in charge of telling what data should be parsed and be downloaded
            //console.log(headers);
            res.end(dataToCSV(dataList, headers), "binary");
          }, 3000);
        }
      );
    });
  } else {
    res.sendStatus(401);
  }
});

// Get Products and Search Products
app.get("/:db_name", function(req, res) {
  if (req.headers.token === token) {
    res.header("Access-Control-Allow-Origin", "*");
    estblish_connec(req.params.db_name);
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
  } else {
    res.sendStatus(401);
  }
});

app.get("/:db_name/:tblName", function(req, res) {
  if (req.headers.token === token) {
    estblish_connec(req.params.db_name);
    getAll(res, req.params.tblName);
  } else {
    res.sendStatus(401);
  }
});

app.get("/:db_name/:tblName/:col_name/:id", function(req, res) {
  if (req.headers.token === token) {
    estblish_connec(req.params.db_name);
    getSpecific(req, res, req.params.tblName, req.params.col_name);
  } else {
    res.sendStatus(401);
  }
});

// PASSPORT testing route
app.post("/:db_name/:tblName/:col_name/new", function(req, res) {
  if (req.headers.token === token) {
    estblish_connec(req.params.db_name);
    addItem(res, req, req.params.tblName, req.params.col_name);
  } else {
    res.sendStatus(401);
  }
});

app.put("/:db_name/:tblName/:col_name/:id/edit", function(req, res) {
  if (req.headers.token === token) {
    estblish_connec(req.params.db_name);
    item_update(req, res, req.params.tblName, req.params.col_name);
  } else {
    res.sendStatus(401);
  }
});

app.delete("/:db_name/:tblName/:col_name/:id/delete", function(req, res) {
  if (req.headers.token === token) {
    estblish_connec(req.params.db_name);
    item_delete(req, res, req.params.tblName, req.params.col_name);
  } else {
    res.sendStatus(401);
  }
});

//listening at port 3000
app.listen(3000, "localhost", function() {
  console.log("The Server Has Started on port 3000!");
});

//MODULAR FUNCTIONS
//Functions making code modular;

// The function gets a list of objects ('dataList' arg), each one would be a single row in the future-to-be CSV file
// The headers to the columns would be sent in an array ('headers' args). It is taken as the second arg
function dataToCSV(dataList, headers) {
  //console.log("dataTOCSV",headers);
  var allObjects = [];
  // Pushing the headers, as the first arr in the 2-dimensional array 'allObjects' would be the first row
  allObjects.push(headers);

  //Now iterating through the list and build up an array that contains the data of every object in the list, in the same order of the headers
  dataList.forEach(function(object) {
    var arr = [];
    Object.entries(object).forEach(([key, value]) => arr.push(value));
    // Adding the array as additional element to the 2-dimensional array. It will evantually be converted to a single row
    allObjects.push(arr);
  });

  // Initializing the output in a new variable 'csvContent'
  var csvContent = "";

  // The code below takes two-dimensional array and converts it to be strctured as CSV
  // *** It can be taken apart from the function, if all you need is to convert an array to CSV
  allObjects.forEach(function(infoArray, index) {
    var dataString = infoArray.join(",");
    csvContent += index < allObjects.length ? dataString + "\n" : dataString;
  });

  // Returning the CSV output
  return csvContent;
}

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
  //console.log(row_counter+" = "+line);
  if (col_header.length != 0 && row_counter === 1) {
    primary_key_colname = col_header[0];
    // IGNORING THE COLUMN HEADER ROW
  } else if (row_counter > 1) {
    var inserter_query = insertQueryGenerator(line);
    var updater_query = UpdateQueryGenerator(line);
    UploaderLogicFunc(inserter_query, updater_query, line);
    // output_array.push(insert_query);
    // output_array.push(update_query + ";");
    //console.log(row_counter+" vs "+total_rows);
    if (row_counter == total_rows) {
      res.send("Import Completed Successfully!!");
      //   res.send(output_array);
    }
  }
}

function UploaderLogicFunc(inserter_query, updater_query, line) {
  var id_extracter_query =
    "SELECT COUNT(*) as row_count FROM " +
    client_tablename +
    " WHERE id=" +
    line[0];

  connection.query(id_extracter_query, function(err, row) {
    if (err) {
      throw err;
    }

    row_availability = row[0]["row_count"];
    //console.log(row_availability);
    if (row_availability === 1) {
      // //console.log(update_query);
      connection.query(updater_query, function(err, rows) {
        if (err) {
          throw err;
        }
        if (rows.affectedRows > 0) {
          //console.log("Row Updated");
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
          //console.log("Row Inserted");
        } else {
          res.send("Error!! Please try again.");
        }
      });
    }
  });
}

function insertQueryGenerator(line) {
  //CONSTRUCTING INSERT QUERY
  var insert_query =
    "INSERT INTO " +
    client_tablename +
    " (" +
    col_header.join(",").split(/,(.+)/)[1] +
    ") VALUES(" +
    line
      .map(line_row => `'${line_row}'`)
      .join(",")
      .split(/,(.+)/)[1] +
    ");";
  //console.log(insert_query);
  return insert_query;
}

function UpdateQueryGenerator(line) {
  //CONSTRUCTING UPDATE QUERY
  var update_query = "UPDATE testing_tbl SET ";
  ////console.log(col_header);
  for (let col in col_header) {
    if (col_header[col] != primary_key_colname) {
      ////console.log("col_header   "+col_header[col]);
      update_query = update_query + col_header[col] + "='" + line[col] + "',";
    } else {
      update_query_id = " WHERE " + primary_key_colname + "=" + line[0];
    }
  }
  update_query = update_query.slice(0, -1) + update_query_id + " ;";
  //console.log(update_query);
  return update_query;
}
//gets the items present in the table
function getAll(res, table_name) {
  res.header("Access-Control-Allow-Origin", "*");
  connection.query("SELECT * FROM `" + table_name + "` ;", function(err, rows) {
    if (err) {
      throw err;
    }
    res.send(rows);
  });
}

//gets a specific item in a specific table
function getSpecific(req, res, table_name, item_name_id) {
  res.header("Access-Control-Allow-Origin", "*");
  connection.query(
    "SELECT * FROM `" +
      table_name +
      "` WHERE " +
      item_name_id +
      " = " +
      req.params.id +
      " ;",
    function(err, rows) {
      if (err) {
        throw err;
      }
      res.send(rows);
    }
  );
}

//Gets the last row of from table passed and corresponding to the item ID as the judgemnet criteria.
function getLastRow(res, table_name, item_id) {
  res.header("Access-Control-Allow-Origin", "*");
  connection.query(
    "SELECT * FROM `" +
      table_name +
      "` WHERE " +
      item_id +
      " = (SELECT MAX(" +
      item_id +
      ") from `" +
      table_name +
      "`)",
    function(err, rows) {
      if (err) {
        throw err;
      }
      res.send(rows);
    }
  );
}

function addItem(res, req, tblName, id_col_name) {
  res.header("Access-Control-Allow-Origin", "*");
  var data = req.body;
  var colNames = [];
  var colValues = [];
  Object.keys(data).forEach(function(key) {
    colNames.push(key);
    colValues.push(data[key] ? "'" + data[key] + "'" : "''");
  });
  var insertQuery =
    "INSERT INTO `" +
    tblName +
    "` (" +
    colNames.join(",") +
    ") VALUES(" +
    colValues.join(",") +
    ");";
  connection.query(insertQuery, function(err, rows) {
    if (err) {
      throw err;
    }
    if (rows.affectedRows > 0) {
      getLastRow(res, tblName, id_col_name);
    } else {
      res.send("Error!! Please try again.");
    }
  });
}

function item_update(req, res, table_name, item_id) {
  res.header("Access-Control-Allow-Origin", "*");
  var content = req.body;
  var content_lenght = Object.keys(content).length;
  if (content_lenght > 0) {
    var update_query = "UPDATE `" + table_name + "` SET ";
    Object.entries(content).forEach(([key, value]) => {
      if (typeof value !== "undefined") {
        update_query += key + "='" + value + "',";
      }
    });
    update_query = update_query.slice(0, -1);
    update_query += " WHERE " + item_id + " =" + req.params.id;
  }

  connection.query(update_query, function(err, rows) {
    if (err) {
      throw err;
    }
    if (rows.affectedRows > 0) {
      connection.query(
        "SELECT * FROM `" +
          table_name +
          "` WHERE " +
          item_id +
          " = " +
          req.params.id +
          " ;",
        function(err, rows) {
          if (err) {
            throw err;
          }
          res.send(rows);
        }
      );
    } else {
      res.send("The `" + table_name + "` has not been updated,Sorry!!");
    }
  });
}

function item_delete(req, res, table_name, item_id) {
  res.header("Access-Control-Allow-Origin", "*");
  var del_query =
    "DELETE FROM `" +
    table_name +
    "` WHERE " +
    item_id +
    " =" +
    req.params.id +
    ";";
  connection.query(del_query, function(err, rows) {
    if (err) {
      throw err;
    }
    res.send("The `" + table_name + "` credentials has been deleted,Thanks!!");
  });
}