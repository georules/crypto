var
	express = require('express'),
	app = express(),
	MongoClient = require('mongodb').MongoClient,
	ObjectID = require('mongodb').ObjectID,
	dbAddress = 'mongodb://127.0.0.1:27017/crypto';

//Message object constructor
function Message(text) {
	this.text = text;
	this.encryptedText = "";
	this.hint = "";
	this.encrypt = function() {
		var unique = [];
		var cryptoChars = [];
		var alphabet = ['a','b','c','d','e','f','g','h',
						'i','j','k','l','m','n','o','p',
						'q','r','s','t','u','v','w','x',
						'y','z'];
		var alphaRemaining = alphabet.slice(0);
		for (var i = 0; i < this.text.length; i++) {
			var c = this.text[i];
			if(alphabet.indexOf(c) !== -1) {
				if(unique.indexOf(c) === -1) {
					unique.push(c);
					var randomAlpha = alphaRemaining.splice(Math.floor(Math.random()*alphaRemaining.length),1);
					cryptoChars.push(randomAlpha);
				}
				this.encryptedText += cryptoChars[unique.indexOf(c)];
			} else {
				this.encryptedText += c;
			}
		}
		var randomHintIndex = Math.floor(Math.random()*cryptoChars.length);
		this.hint = cryptoChars[randomHintIndex] + " = " + unique[randomHintIndex];
	};
	this.createDoc = function() {
		var doc = {};
		doc['text'] = this.text;
		doc['encryptedText'] = this.encryptedText;
		doc['hint'] = this.hint;
		doc['date'] = new Date();
		return doc;
	};
	this.createFromDoc = function(doc) {
		this.text = doc.text;
		this.encryptedText = doc.encryptedText;
		this.hint = doc.hint;
		this.id = doc._id;
	};
}

//Store a message in the mongo db
function store(message, callback) {
	MongoClient.connect(dbAddress, function(err, db) {
		if(err) throw err;
		var collection = db.collection('messages');
		collection.insert(message.createDoc(), function(err,result) {
			if(err) throw err;
			else if(result) {
				message.id = result[0]._id;
			}
			callback();
			db.close();
		});
	});
}

//Retrieve a message from the mongo db
function retrieve(id, callback) {
	try {
		id = new ObjectID(id);
	} catch (e){
		callback(null);
	}
	MongoClient.connect(dbAddress, function(err, db) {
		if(err) throw err;
		var collection = db.collection('messages');
		collection.findOne({_id:id}, function(err, item) {
			callback(item);
			db.close();
		});
	});
}

//Handle GET root
function getMain(req,res) {
	res.sendfile('main.html');
}

//Handle POST /message
function postMessage(req,res) {
	var message = new Message(req.body.message);
	message.encrypt();
	store(message, function() {
		res.json(message);
	});
}

//Handle GET /message
function getMessage(req,res) {
	if(req.query.id) {
		retrieve(req.query.id,function(doc) {
			res.json(doc);
		});
	} else {
		res.sendfile('404.html');
	}
}

//Handle GET /view
function getView(req,res) {
	res.sendfile('message.html');
}

//Handle GET styles.css
function getStyles(req,res) {
	res.sendfile('styles.css');
}

//Handle 404s
function pageNotFound(req,res,next) {
	res.sendfile('404.html');
}

/*
* Routes and middleware
*/
app.use(express.bodyParser());
app.get('/', getMain);
app.get('/styles.css', getStyles);
app.post('/message', postMessage);
app.get('/message', getMessage);
app.get('/view', getView);
app.use(express.favicon('favicon.ico'));
app.use(pageNotFound);

//Listen
var listenPort = 80;
app.listen(listenPort);
console.log('Listening on port ' + listenPort);