var express = require('express');
var http = require('http');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var bodyParser = require('body-parser');
var app = express();

var databaseUrl = 'mongodb://localhost:27017/test';


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
http.createServer(app).listen(3000);



var longurl;

var islongUrlExist = function(longurl, callback) {
    client.hget("sort1", "longurl", function(err, response) {
        callback(err, response);
    });
};

function generateSortUrl() {
    var temp = Date.now();
    return (temp.toString(36));

}

app.get('/test',function(req,res){
    MongoClient.connect(url,function(err,db){
    if(err){
        console.log("Problem connecting database");
    }
    else{
       var collection = db.collection('url');
     collection.find().toArray(function(err,items){
         if(err){console.log(err);}
            console.log(items);
         res.end();
        });
    }
});
     
});

app.post('/getUrl', function(req, res) {
    var url = req.body.url1;
        var index = url.indexOf("localhost:3000");
    MongoClient.connect(databaseUrl,function(err,db){
    if(err){
        console.log("Problem connecting database");
    }
    else{
        
        
        var collection = db.collection('url');
        if (index > -1 && index < 8) {
        //sorturl
        collection.find({sorturl:url}).toArray(function(err,items){
            res.json({
            "url":items[0].longurl
            });
        });
        }
        else {
        //longurl
            collection.find({longurl:url}).toArray(function(err,items){
                console.log("items 1");
                console.log(items.length);
                if(items.length <=0){
                    console.log("LongUrl not yet exist");
                //create new url 
                var sorturl = generateSortUrl();
                sorturl = "localhost:3000/" + sorturl;
                    var urlDb = {sorturl:sorturl,longurl:url};
                collection.insert(urlDb,function(err,result){
                    if(err){
                        console.log(err);
                    }else{
                        res.json({"url":sorturl});
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
     
         



app.get('/gettop', function(req, res) {
/*
    client.zrevrangebyscore("views", "+inf", 0,"withscores", "limit", 0, 10, function(err, response) {
        res.json({
            "top": response
        });
    });
*/
});
app.get('/:url', function(req, res) {
  /*  var url = req.params.url;
    url = "localhost:3000/" + url;
   
    client.hget(url, "longurl", function(err, response) {
        if (response === null) {
            res.status(404).send("Url not exist");
        } else {
            client.zincrby("views", 1, response, redis.print);
            res.redirect(response);
        }
    });
*/
});