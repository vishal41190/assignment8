
  var express = require("express");
  var http = require("http");
  var path = require("path");
  var MongoClient = require("mongodb").MongoClient;
  var bodyParser = require("body-parser");
  var app = express();

  var databaseUrl = "mongodb://localhost:27017/test";


  app.use(express.static(path.join(__dirname, "public")));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
      extended: false
  }));
  http.createServer(app).listen(3000);

  function generateSortUrl() {
      var temp = Date.now();
      return (temp.toString(36));

  }


  app.post("/getUrl", function(req, res) {
      var url = req.body.url1;
      var index = url.indexOf("localhost:3000");
      MongoClient.connect(databaseUrl, function(err, db) {
          if (err) {
              console.log("Problem connecting database");
              res.status(404).send("Problem connecting database");
          } else {


              var collection = db.collection("url",{ capped: true, size: 100000 });
              if (index > -1 && index < 8) {
                  //sorturl
                  collection.find({ 
                      sorturl: url
                  }).toArray(function(err, items) {
                      res.json({
                          "url": items[0].longurl
                      });
                  });
              } else {
                  //longurl
                  collection.find({
                      longurl: url
                  }).toArray(function(err, items) {
                     
                      if (items.length <= 0) {
                          console.log("LongUrl not yet exist");
                          //create new url 
                          var sorturl = generateSortUrl();
                          sorturl = "localhost:3000/" + sorturl;
                          var urlDb = {
                              sorturl: sorturl,
                              longurl: url,
                              views: 1
                          };
                          collection.insert(urlDb, function(err, result) {
                              if (err) {
                                  console.log(err);
                              } else {
                                  res.json({
                                      "url": sorturl
                                  });
                              }
                          });

                      } else {
                          //LongUrl already exital
                          res.json({
                              "url": items[0].sorturl
                          });
                      }
                  });


              }
          }

      });
  });


  app.get("/gettop", function(req, res) {

      var url = req.params.url;
      url = "localhost:3000/" + url;
      MongoClient.connect(databaseUrl, function(err, db) {
          if (err) {
              console.log("Problem connecting database");
              res.status(404).send("Problem connecting database");
          } else {
              var collection = db.collection("url",{ capped: true, size: 100000 });
              collection.find().sort({
                  views: -1
              }).limit(10).toArray(function(err, items) {
                  res.json(items);
                 
              });
          }
      });

  });
  app.get("/:url", function(req, res) {
      var url = req.params.url;
      url = "localhost:3000/" + url;
      MongoClient.connect(databaseUrl, function(err, db) {
          if (err) {
              console.log("Problem connecting database");
              res.status(404).send("Problem connecting database");
          } else {
              var collection = db.collection("url",{ capped: true, size: 100000 });
              collection.find({
                  sorturl: url
              }).toArray(function(err, items) {
                  if (items.length <= 0) {
                      res.status(404).send("URL not Exist");
                  } else {
                      collection.update({
                          sorturl: url
                      }, {
                          $inc: {
                              views: 1
                          }
                      });
                      res.redirect(items[0].longurl);
                  }
              });

          }
      });




  });