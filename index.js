var http = require('http'),
		express = require('express'),
		path = require('path'),
		MongoClient = require('mongodb').MongoClient,
		Server = require('mongodb').Server,
		CollectionDriver = require('./collectionDriver').CollectionDriver;
		ObjectID = require('mongodb').ObjectID;

 
var app = express();
app.set('port', process.env.PORT || 3000); 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.bodyParser()); 

var mongoHost = 'localHost'; 
var mongoPort = 27017; 
var collectionDriver;
var db

var mongoClient = new MongoClient(new Server(mongoHost, mongoPort)); 
mongoClient.open(function(err, mongoClient) { 
	if (!mongoClient) {
			console.error("Error! Exiting... Must start MongoDB first");
			process.exit(1); 
	}
	db = mongoClient.db("paypalData");  
	collectionDriver = new CollectionDriver(db); 

	db.collection("user", {}, function(err, coll) {
    if (err != null) {
      db.createCollection("user", function(err, result) {
        assert.equal(null, err);
      });
    }
    db.ensureIndex("user", {
      email: "text"
    }, function(err, indexname) {
      console.log(err)
    });
  });
});

app.use(express.static(path.join(__dirname, 'public')));
 
app.get('/', function (req, res) {
	res.send('<html><body><h1>Hello World</h1></body></html>');
});
 
app.get('/:collection', function(req, res) { 
	 var params = req.params; 
	 collectionDriver.findAll(req.params.collection, function(error, objs) { 
				if (error) { res.send(400, error); } 
				else { 
						res.set('Content-Type','application/json'); 
							res.send(200, objs); 
				 }
		});
});

app.get('/search/:collection/:entity', function(req, res) { 
	var params = req.params;
	var entity = params.entity;
	var collection = params.collection;
	var index = 'activity'
	if (collection == 'user') {
		index = 'user';
	};
	

	db.collection(index).find({
    "$text": {
      "$search": "/"+entity+"/"
    }
  // }, {
  //   textScore: {
  //     $meta: index
  //   }
  // }, {
  //   sort: {
  //     textScore: {
  //       $meta: index
  //     }
  //   }
  }).toArray(function(err, items) {
  	res.set('Content-Type','application/json');
    res.send(200, items);
  })
	});




app.get('/:collection/:entity', function(req, res) { //I
	var params = req.params;
	var entity = params.entity;
	var collection = params.collection;
	if (collection != 'details') {
		if (entity) {
			collectionDriver.get(collection, entity, function(error, objs) { //J
				if (error) {
					res.send(400, error);
				} else {
					res.send(200, objs);
				} //K
			});
		} else {
			res.send(400, {
				error: 'bad url',
				url: req.url
			});
		}
	} else {
		if (entity) {
			var activityID = new ObjectID(entity)
			collectionDriver.get('activity', activityID, function(error, activityObj) { //J
				if (error) {
					res.send(400, error);
				} else {
					// res.send(200, objs);
					if (entity) {
						var userID = new ObjectID(activityObj.user_id)
						collectionDriver.get('user', userID, function(error, userObj) { //J
							if (error) {
								res.send(400, error);
							} else {
								for (var attrname in userObj) { activityObj[attrname] = userObj[attrname]; }
								res.send(200, activityObj);
							} //K
						});
					} else {
						res.send(400, {
							error: 'bad url',
							url: req.url
						});
					}
				} //K
			});
		} else {
			res.send(400, {
				error: 'bad url',
				url: req.url
			});
		}
	}
});




app.post('/:collection', function(req, res) { 
		var object = req.body;
		var collection = req.params.collection;
		collectionDriver.save(collection, object, function(err,docs) {
					if (err) { res.send(400, err); } 
					else { res.send(201, docs); } 
		 });
});

app.put('/:collection/:entity', function(req, res) { 
		var params = req.params;
		var entity = params.entity;
		var collection = params.collection;
		if (entity) {
			 collectionDriver.update(collection, req.body, entity, function(error, objs) { 
					if (error) { res.send(400, error); }
					else { res.send(200, objs); } 
			 });
	 } else {
		 var error = { "message" : "Cannot PUT a whole collection" }
		 res.send(400, error);
	 }
});

app.delete('/:collection/:entity', function(req, res) { 
		var params = req.params;
		var entity = params.entity;
		var collection = params.collection;
		if (entity) {
			 collectionDriver.delete(collection, entity, function(error, objs) { 
					if (error) { res.send(400, error); }
					else { res.send(200, objs); } 
			 });
	 } else {
			 var error = { "message" : "Cannot DELETE a whole collection" }
			 res.send(400, error);
	 }
});
 
app.use(function (req,res) {
		res.render('404', {url:req.url});
});

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});