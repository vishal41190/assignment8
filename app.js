var express = require("express");
var http = require("http");
var path = require("path");
var MongoClient = require("mongodb").MongoClient;
var bodyParser = require("body-parser");
var Q = require("q");
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


function getdb() {
    var deferred = Q.defer();
    MongoClient.connect(databaseUrl, function(err, db) {
        if (err) {
            console.log("Problem connecting database");
            deferred.reject(new Error(err));
        } else {


            var collection = db.collection("url", {
                capped: true,
                size: 100000
            });
            deferred.resolve(collection);
        }
    });
    return deferred.promise;
}
app.get("/test", function(req, res) {
    getdb().then(function(collection) {
        console.log(collection);
        collection.find().limit(5).toArray(function(err, items) {
            console.log(items);
            res.send("Check Console");
        });
    }).fail(function(err) {
        console.log(err);
        res.send("Problem connecting database");
    });


});
app.post("/getUrl", function(req, res) {
    var url = req.body.url1;
    var index = url.indexOf("localhost:3000");

    if (index > -1 && index < 8) {
        //sorturl
        getdb().then(function(collection) {
            collection.find({
                sorturl: url
            }).toArray(function(err, items) {
                res.json({
                    "url": items[0].longurl
                });
            }).fail(function(err) {
                res.status(404).send("Problem connecting database");
            });
        });

    } else {
        //longurl
        getdb().then(function(collection) {
            collection.find({
                longurl: url
            }).toArray(function(err, items) {

                if (items.length <= 0) {

                    //create new url 
                    var sorturl = generateSortUrl();
                    sorturl = "localhost:3000/" + sorturl;
                    var urlDb = {
                        sorturl: sorturl,
                        longurl: url,
                        views: 1
                    };
                    getdb().then(function(collection) {
                        collection.insert(urlDb, function(err, result) {
                            if (err) {
                                console.log(err);
                            } else {
                                res.json({
                                    "url": sorturl
                                });
                            }
                        });
                    }).fail(function(err) {
                        res.status(404).send("Problem connecting database");
                    });


                } else {
                    //LongUrl already exital
                    res.json({
                        "url": items[0].sorturl
                    });
                }
            });
        }).fail(function(err) {
            res.status(404).send("Problem connecting database");
        });



    }

});


app.get("/gettop", function(req, res) {

    var url = req.params.url;
    url = "localhost:3000/" + url;

    getdb().then(function(collection) {
        collection.find().sort({
            views: -1
        }).limit(10).toArray(function(err, items) {
            res.json(items);

        });
    }).fail(function(err) {
        res.status(404).send("Problem connecting database");
    });



});
app.get("/:url", function(req, res) {
    var url = req.params.url;
    url = "localhost:3000/" + url;
    getdb().then(function(collection) {
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

    }).fail(function(err) {
        res.status(404).send("Problem connecting database");
    });




});