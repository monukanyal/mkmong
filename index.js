/*---------------------Setup area----------------------------
------------------------------------------------------------*/
	var express = require('express');
	var cookieParser = require('cookie-parser');
	var config = require('./config');
	var app  = express();
	app.set('port', process.env.PORT || 3000);
	app.set('view engine', 'ejs');
	//var formid = require('formidable');
	var upload=require('express-fileupload');
	var nodemailer=require('nodemailer');
	var http=require('http').Server(app);
	//var io=require('socket.io')(http);
	 http.listen(app.get('port'));
	//------session---------------
		app.use(cookieParser());
		var session = require('express-session')		
		const MongoStore = require('connect-mongo')(session);
		app.use(session({
		    secret: 'secretsessionquick',
		    resave:true,
		    saveUninitialized: false,
		    store: new MongoStore({        
			url: config.db_url,
		    //username: 'cm',
		   // password: 'cm', 
		    collection: 'session', 
		    auto_reconnect:true
			 })
		}));
	//------------session end---------------
	var fs = require('fs');
	app.use(upload()); //for file upload -- html form file upload imp
	app.use('/public', express.static('vendors'));  // for static js ,css, image file path --use public/
	console.log('Server running at http://127.0.0.1:'+ app.get('port'));
	//--------mongo db ---------------------
	var mongodb = require('mongodb');
	var MongoClient = mongodb.MongoClient; //1st way -imp
	MongoClient.connect(config.db_url, function(err, db) {
	  if (err) throw err;
	  console.log("Database created or connected!");
	  //db.close();
	});
	require('./controllers')(app, config,MongoClient)
/*-------------------Setup area end----------------------------
--------------------------------------------------------------- */
		
	