		/*---------------------Setup area----------------------------
		------------------------------------------------------------*/
			var express = require('express');
			var md5 = require('md5');
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
	            //collection: 'session', 
	            auto_reconnect:true
       		 })
			}));

			//---------------------------
			
			//var querystring = require('querystring');
			var fs = require('fs');
			var unq_request=require('request'); // for calling http or https request
			//var dt = require('./firstmod');
			app.use(upload()); //for file upload -- html form file upload imp
			app.use('/public', express.static('vendors'));  // for static js ,css, image file path --use public/
			console.log('Server running at http://127.0.0.1:'+ app.get('port'));
			//--------mongo db ---------------------
			var mongodb = require('mongodb');
			var MongoClient = mongodb.MongoClient; //1st way -imp
			//var MongoClient = require('mongodb').MongoClient; //2nd way
			var url = config.db_url;

			MongoClient.connect(url, function(err, db) {
			  if (err) throw err;
			  console.log("Database created or connected!");
			  db.close();
			});
		/*-------------------Setup area end----------------------------
		--------------------------------------------------------------- */
		app.get('/',function(req,res){
			res.render('index');
		});
		app.post('/mongo_sign_in',function(req,res){
				//console.log(req.body.email);
				var email=req.body.email;
				var pwd=md5(req.body.pwd);
				MongoClient.connect(url,function(err,db){
					var myobj= { $and: [ {email:email}, {pwd:pwd} ] };
					//var myobj= { email:email};
					  db.collection("users").findOne(myobj, function(err, result) {
					  	if(err)
					  	{
					  		res.render('index',{msg:'Something is wrong ,please try again later.'});  
					  	}
					  	else
					  	{
					  		if(result){
					  					console.log(result._id);
					  				req.session.userid=result._id;
									req.session.myfile=result.myfile;
									req.session.name=result.name;
									req.session.email=result.email;
									req.session.role=result.role;
  									res.redirect('/dashboard');
					  		}
					  		else
					  		{
					  			res.render('index',{msg:'Please provide correct email-id and password.'});  
					  		}
					  		
					  	}
					  });
				});
				
		});
	
		app.get('/dashboard',function(req,res){
			//console.log('Session Data:'+req.session.email);
			var userid=req.session.userid;	
			var name=req.session.name;	
			var email=req.session.email;
			var role=req.session.role;
			var myfile=req.session.myfile;
			if(req.session.userid)
			{
				MongoClient.connect(url,function(err,db){
				if (err) throw err;
				var myobj={email:email};
				db.collection("users").findOne(myobj,function(err,result){
					if(err)
					{
					  res.redirect('/');
					}
					else
					{
						if(result)
						{
							req.session.myfile=result.myfile;
							MongoClient.connect(url,function(err,db){
								if (err) throw err;
								db.collection("users").find({role:'user'}).toArray(function(nerr,newresult){
									if(nerr) throw nerr;
									//console.log('all\n');
									console.log(newresult);
									
									res.render('dashboard',{name:name,email:email,userid:userid,myfile:req.session.myfile,role:role,list:newresult}); 
								});
								
							});
						}
						else
						{
							console.log('no list');
							res.render('dashboard',{name:name,email:email,userid:userid,myfile:myfile,role:role}); 
						}

					}
				});
			});
		}
		else
		{
			res.redirect('/');
		}

		});

		app.get('/sign_up',function(request,response){

	 	response.render('sign_up');  

		});

		app.get('/mongo_logout',function(req,res){
			req.session.destroy();
			res.redirect('/');
		});

		app.post('/quick_register', function(request,response){
				//console.log(req);
				var email=request.body.email;
				var name=request.body.name;
				var pwd=md5(request.body.pwd);
				var file=request.files.myfile;   //request.files.filenamefield
				var filename=file.name;
				file.mv("./vendors/upload/"+filename,function(err){
				if(err)
				{
					console.log(err);
					response.send('something is wrong'+err);
				}
				else
				{
					MongoClient.connect(url, function(err, db) {
						  if (err) throw err;
						  var myobj = { name:name, email: email,myfile:filename,pwd:pwd,role:'user' };
						  db.collection("users").insertOne(myobj, function(err, res) {
						    if (err)
						    {
						    	 response.send('Something is wrong.');
						    }
						    else
						    {
						    	console.log("1 record inserted");
						    	response.send('Your data registered successfully');
						    }
						    db.close();
						  });
					});
							
							

						//mail start
						// var transporter = nodemailer.createTransport({
						// 	service: 'gmail',
						// 	auth: {
						// 	user: '',
						// 	pass: ''
						// 	}
						// 	});	

						// 	var mailOptions = {
						// 		  from: 'monu_kanyal@esferasoft.com',
						// 		  to:email,
						// 		  subject: 'Sending email -monu_kanyal',
						// 		  text: 'Hey,testing for mail!'
						// 		};
						// 	transporter.sendMail(mailOptions, function(error, info){
						// 	  if (error) {
						// 	    console.log(error);
						// 	  } else {
						// 	    console.log('Email sent: ' + info.response);
						// 	  }
						// 	});	
						// 	//mail end

						// console.log('done');
						// response.send('successfully uploaded');
						//--------sending mail to specified-------

				}
				})

		});

		app.post('/quick_update',function(request,response){
		var email=request.body.email;
		//var userid=request.session.userid;
		//var name=request.body.name;
		var file=request.files.myfile;   //request.files.filenamefield
		var filename=file.name;
		console.log(filename);
		if(request.session.userid)
		{
			
				file.mv("./vendors/upload/"+filename,function(err){
				if(err)
				{
					console.log(err);
					response.send('something is wrong'+err);
				}
				else
				{
					MongoClient.connect(url,function(err,db){
						if(err) throw err;
						db.collection("users").findOneAndUpdate({email:email},{$set: {myfile:filename}},function(err,result){
							if(err)
							{
								 console.log("Something wrong when updating data!");
								response.send('Something is wrong,please try again later');
							}
							else
							{
								if(result)
								{
									console.log(result);   //return updated data  -only in findOneAndUpdate  query
									console.log(result.lastErrorObject.updatedExisting);  //true--updated and false
									response.send('Your data updated successfully');
								}
								else
								{
									response.send('Something is wrong.');
								}
							
							}

							});
						
						});
				}

			});
		}
		else
		{
			response.redirect('/');
		}
	});
		 app.get('/change_pwd',function(request,response){
		var userid=request.session.userid;	
		var name=request.session.name;	
		var email=request.session.email;
		var myfile=request.session.myfile;
		var role=request.session.role;
		if(request.session.userid)
		{
			response.render('change_pwd',{userid:userid,name:name,email:email,myfile:myfile,role:role})
		}
		else
		{
			response.redirect('/');
		}
	});

	app.post('/quick_change_pwd',function(request,response){
			var pwd=md5(request.body.newpwd);
			var userid=request.body.userid;
			var email=request.session.email;
			//console.log(pwd);
			//console.log(userid);
			MongoClient.connect(url,function(err,db){
				db.collection("users").update({email:email},{$set:{pwd:pwd}},function(err,result){
					if(err)
					{
						response.send('Something is wrong.');
					}
					else
					{
						if(result)
						{
							response.send('updated');
						}
						else
						{
							response.send('Something is wrong.');
						}
					}
				});
			});
			
	});

	app.post('/quick_delete_user',express.bodyParser(),function(req,res){
			
		//console.log('body: ' + JSON.stringify(req.body));
		console.log(req.body.email);
		console.log(req.body.id);
		var userid=req.body.id;
		MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  var myquery = { _id: new mongodb.ObjectID(userid) };
		  db.collection("users").deleteOne(myquery, function(err, obj) {
		    if (err) throw err;
		    res.send('1 user/doc deleted');
		    //console.log("1 user/doc deleted");
		    db.close();
		  });
		});
	});