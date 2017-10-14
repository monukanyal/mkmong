		/*---------------------Setup area----------------------------
		------------------------------------------------------------*/
			var express = require('express');
			var mysql=require('mysql');
			var md5 = require('md5');	
			var app  = express();
			
			app.set('view engine', 'ejs');

			var upload=require('express-fileupload');
			var nodemailer=require('nodemailer');
			var http=require('http').Server(app);
			var io=require('socket.io')(http);

			http.listen(3000);
			var con = require('./connection');
			//---------session setup start--------------------------------------------
			var session = require('express-session')	
			var MySQLStore = require('express-mysql-session')(session);
				var options = {
				    host: 'localhost',
				    port: 3306,
				    user: 'root',
				    password: 'esfera',
				    database: 'mktestnp_db'
				};
				 
				var sessionStore = new MySQLStore(options);
				 
				app.use(session({
				    key: 'session_cookie_name',
				    secret: 'abcdgfgs34687563658634',
				    store: sessionStore,
				    resave: false,
				    saveUninitialized: false
				}));
			//-----------------session setup end------------------------------------------
			//var querystring = require('querystring');
			//var fs = require('fs');
			app.use(upload()); //for file upload -- html form file upload imp
			app.use('/public', express.static('vendors'));  // for static js ,css, image file path --use public/

			console.log('Server running at http://localhost:3000/');
			
			/*------------------outlook file---------*/
			var authHelper = require('./authHelper');
			var outlook = require('node-outlook');
			var moment = require('moment');
			/*----------------Google credential-------------------------*/
			var google = require('googleapis');
			var OAuth2 = google.auth.OAuth2;
			const ClientId = "412272539871-t6lnudppe49cuhl9jmmlrtkocm46v5sp.apps.googleusercontent.com";
           const ClientSecret = "3rcPgoW61oRH0UhYavWAsKga";
           const RedirectionUrl = "http://localhost:3000/Google_calendar";
           /* -------------------------------------------------------------- */
			/*-------------------Setup area end----------------------------
					if (request.session.user) 
					{
						request.session.destroy();
						response.redirect('/firebasechat');
					}
			--------------------------------------------------------------- */

	
	/*-----------started functionality code------------------------*/
	//-------outlook--------------------------------
	app.get('/start_outauth',function(request,response){
		var url=authHelper.getAuthUrl();
				response.redirect(url);
	});
	app.use("/outlook_auth", function (req, res) {

	    var session = req.session;
	    var authCode = req.param('code');;
	    if (authCode) {
	    console.log('');
	    console.log('Retrieved auth code in /outlook_auth: ' + authCode);
	     authHelper.getTokenFromCode(authCode, tokenReceived, req, res);

	  }
	  else {
	    // redirect to home
	    console.log('/authorize called without a code parameter, redirecting to login');
	    res.redirect('/');
	  }
	});

 function tokenReceived(req, res, error, token) {
	  if (error) {
	    console.log('ERROR getting token:'  + error);
	    res.send('ERROR getting token: ' + error);
	  }
	  else {
	    // save tokens in session
	    var userid=req.session.userid;	
	   var access_token = token.token.access_token;
	   // req.session.refresh_token = token.token.refresh_token;
	   // req.session.myemail = authHelper.getEmailFromIdToken(token.token.id_token);
	    var myemail = authHelper.getEmailFromIdToken(token.token.id_token);
	    var query_new="UPDATE user set outlook_access='"+access_token+"',outlook_mail='"+myemail+"'WHERE id='"+userid+"'";
									con.query(query_new,function(err,result){
										 console.log('outlook:\n'+myemail+'\n');
	   										 res.redirect('/show_calendar');
									});
	   
	  }
}

app.get('/auth_outlook',function(request,response){
		var url=authHelper.getAuthUrl();
		response.redirect(url);
});

//------------outlook end-----------------------

	app.get('/',function(request,response){

		//response.sendFile(__dirname+'/registration_form.html');  //no use simple html show
	 	response.render('index',{page_title:'Home'});   
	});
function getOAuthClient () {
    return new OAuth2(ClientId ,  ClientSecret, RedirectionUrl);
}
 
function getAuthUrl () {
    var oauth2Client = getOAuthClient();
    // generate a url that asks permissions for Google+ and Google Calendar scopes
    var scopes = [
      'https://www.googleapis.com/auth/calendar'
    ];
 
    var url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes // If you only need one scope you can pass it as string
    });
 
    return url;
}
 
app.use("/Google_calendar", function (req, res) {
    var oauth2Client = getOAuthClient();
    var session = req.session;
    var code =req.param('code');;
    oauth2Client.getToken(code, function(err, tokens) {
      // Now tokens contains an access_token and an optional refresh_token. Save them.
      if(!err) {
        oauth2Client.setCredentials(tokens);
        //req.session.googletokens=tokens;
         var userid=req.session.userid;	
        var googletokens=tokens.access_token;
        var googletokens_refresh=tokens.refresh_token;
      //  console.log(JSON.stringify(googletokens));
        //console.log(req.session);
         var query_new="UPDATE user set google_access='"+googletokens+"',google_refresh='"+googletokens_refresh+"' WHERE id='"+userid+"'";
									con.query(query_new,function(err,result){
										 console.log('\ngoogle: stored\n\n');
	   										 res.redirect('/show_calendar');
									});
       // res.redirect('/show_calendar');
       // res.send('<h3>Login successful!!</h3><a href="/details">Go to details page</a>');
      }
      else{
        res.send('<h3>Login failed!!</h3>');
        
      }
    });
});
 

 
app.use("/google_Auth", function (req, res) {
	if(req.session.googletokens)
	{
		res.redirect('/show_calendar');
	}else
	{
    var url = getAuthUrl();
    res.redirect(url);
    //res.send('<h1>Authentication using google oAuth</h1><a href="'+url+'">Login</a>;')
	}
});
 

	app.get('/show_calendar',function(request,response){
	          var userid=request.session.userid;	
				if(userid)
				{
					var name=request.session.name;	
					var email=request.session.email;
					var myfile=request.session.myfile;
					var google_access='';
					var google_refresh='';
					var outlook_access='';
					var outlook_mail='';
					var query="SELECT * FROM user WHERE id='"+userid+"'";
					con.query(query,function(err,result){
							if(err)
							{
								console.log('\ndberror:'+err);
							}else
							{
								console.log("\n"+result);
								if(result.length==1)
								{
									//----------------
									google_access=result[0].google_access;
									google_refresh=result[0].google_refresh;
									outlook_access=result[0].outlook_access;
									outlook_mail=result[0].outlook_mail;
									if((google_access==null)||(google_access==''))
									{
										//console.log('empty google access');
										google_access='';
									}
									if((outlook_access==null)||(outlook_access==''))
									{
										//console.log('empty outlook access');
										outlook_access='';
									}
										if((outlook_access!='')&&(google_access!=''))
										{
											    console.log('both');
												var myemail=outlook_mail;
												var token=outlook_access;
											 // Set the endpoint to API v2
												outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
												// Set the user's email as the anchor mailbox
												outlook.base.setAnchorMailbox(myemail);
												// Set the preferred time zone
												outlook.base.setPreferredTimeZone('Eastern Standard Time');

												// Use the syncUrl if available
												var requestUrl = request.session.syncUrl;
												if (requestUrl === undefined) {
												// Calendar sync works on the CalendarView endpoint
												requestUrl = outlook.base.apiEndpoint() + '/Me/CalendarView';
												}

												// Set up our sync window from midnight on the current day to
												// midnight 7 days from now.
												var startDate = moment().startOf('day');
												var endDate = moment(startDate).add(7, 'days');
												// The start and end date are passed as query parameters
												var params = {
												startDateTime: startDate.toISOString(),
												endDateTime: endDate.toISOString()
												};

												// Set the required headers for sync
												var headers = {
												Prefer: [ 
												  // Enables sync functionality
												  'odata.track-changes',
												  // Requests only 5 changes per response
												 // 'odata.maxpagesize=5'
												]
												};

												var apiOptions = {
												url: requestUrl,
												token: token,
												headers: headers,
												query: params
												};

												outlook.base.makeApiCall(apiOptions, function(error, res) {
												if (error) {
												  console.log(JSON.stringify(error));
												 // res.send(JSON.stringify(error));
												}
												else {
												  if (res.statusCode !== 200) {
													console.log('API Call returned ' + res.statusCode);
													//res.send('API Call returned ' + res.statusCode);
												  }
												  else {
													// var nextLink = response.body['@odata.nextLink'];
													// if (nextLink !== undefined) {
													//   request.session.syncUrl = nextLink;
													// }
													// var deltaLink = response.body['@odata.deltaLink'];
													// if (deltaLink !== undefined) {
													//   request.session.syncUrl = deltaLink;
													// }
													//console.log(res.body.value);
													var arr=[];
													var start_time;
													var end_time;
													var start;
													var end;
													  for(var j=0;j<res.body.value.length;j++)
													  {
														start=res.body.value[j].Start.DateTime;
														end=res.body.value[j].End.DateTime;
														st= start.substring(start.indexOf("T") + 1);
														var n= st.indexOf(':00.0000000');
														start_time = st.substring(0, n != -1 ? n : st.length);
														et = end.substring(end.indexOf("T") + 1);
															var m= et.indexOf(':00.0000000');
														end_time = et.substring(0, m != -1 ? m : et.length);

														 console.log(res.body.value[j].Subject+'\n');
														arr.push("{ title:'"+res.body.value[j].Subject+"'");
														arr.push("start:'"+start+"'");
														arr.push("start_time:'"+start_time+"'");
														arr.push("end:'"+end+"'");
														arr.push("end_time:'"+end_time+"'}");
													  }
													  //res.body.value[j].Location.DisplayName.toString()
													  var mymainarr='['+arr+']';
													  console.log(mymainarr);
														//response.render('calendar',{userid:userid,name:name,email:email,myfile:myfile,outevents:myarr,page_title:'Calendar'});
														//--------google-----------------
													var oauth2Client = getOAuthClient();
													oauth2Client.setCredentials({ access_token:google_access,refresh_token:google_refresh});
													var calendar = google.calendar('v3');
													calendar.events.list({
													/*  
													calendar.events.watch({
													auth: oauth2Client,
													 resource: {
														id: "12345",  //unique channel id -self made
														type: 'web_hook',
														address: 'https://xyz.com'
													 },
													calendarId: 'primary' */
													auth: oauth2Client,
													calendarId: 'primary',
													//timeMin: (new Date()).toISOString(),
													//maxResults: 10,
													singleEvents: true,
													orderBy: 'startTime'

													}, function(err, googleres) {
													if (err) {
														console.log('The API returned an error: ' + err);
														return;
													}
													var events = googleres.items;
													if (events.length == 0) {
													console.log('No upcoming events found.');
													} else {
													console.log('Upcoming 10 events:');
													var narr=[];

													for(var i=0;i<events.length;i++){
														narr.push("{title:'"+events[i].summary+"'");
														narr.push("start:'"+events[i].start.dateTime+"'");
														narr.push("end:'"+events[i].end.dateTime+"'}");

													}
													var mainarr='['+narr+']';
														console.log(mainarr);
													}
													//green icon and red icon
														response.render('Calendar',{userid:userid,name:name,email:email,myfile:myfile,gevents:mainarr,outevents:mymainarr,page_title:'Calendar',googleauth:'active',outlookauth:'active'});
								
													});
									
														// google end
												  }
												}
											});

											
										}	
										 else if(outlook_access!='')
										{
											console.log('only outlook');
											//-------------------outlook
											//var myemail=request.session.myemail;
											//var token=request.session.access_token;
												var myemail=outlook_mail;
												var token=outlook_access;
											 // Set the endpoint to API v2
												outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
												// Set the user's email as the anchor mailbox
												outlook.base.setAnchorMailbox(myemail);
												// Set the preferred time zone
												outlook.base.setPreferredTimeZone('Eastern Standard Time');

												// Use the syncUrl if available
												var requestUrl = request.session.syncUrl;
												if (requestUrl === undefined) {
												// Calendar sync works on the CalendarView endpoint
												requestUrl = outlook.base.apiEndpoint() + '/Me/CalendarView';
												}

												// Set up our sync window from midnight on the current day to
												// midnight 7 days from now.
												var startDate = moment().startOf('day');
												var endDate = moment(startDate).add(7, 'days');
												// The start and end date are passed as query parameters
												var params = {
												startDateTime: startDate.toISOString(),
												endDateTime: endDate.toISOString()
												};

												// Set the required headers for sync
												var headers = {
												Prefer: [ 
												  // Enables sync functionality
												  'odata.track-changes',
												  // Requests only 5 changes per response
												 // 'odata.maxpagesize=5'
												]
												};

												var apiOptions = {
												url: requestUrl,
												token: token,
												headers: headers,
												query: params
												};

												outlook.base.makeApiCall(apiOptions, function(error, res) {
												if (error) {
												  console.log(JSON.stringify(error));
												 // res.send(JSON.stringify(error));
												}
												else {
												  if (res.statusCode !== 200) {
													console.log('API Call returned ' + res.statusCode);
													res.send('API Call returned ' + res.statusCode);
												  }
												  else {
													// var nextLink = response.body['@odata.nextLink'];
													// if (nextLink !== undefined) {
													//   request.session.syncUrl = nextLink;
													// }
													// var deltaLink = response.body['@odata.deltaLink'];
													// if (deltaLink !== undefined) {
													//   request.session.syncUrl = deltaLink;
													// }
													console.log(res.body.value);
													var arr=[];
													var start_time;
													var end_time;
													var start;
													var end;
													  for(var j=0;j<res.body.value.length;j++)
													  {
														start=res.body.value[j].Start.DateTime;
														end=res.body.value[j].End.DateTime;
														st= start.substring(start.indexOf("T") + 1);
														var n= st.indexOf(':00.0000000');
														start_time = st.substring(0, n != -1 ? n : st.length);
														et = end.substring(end.indexOf("T") + 1);
															var m= et.indexOf(':00.0000000');
														end_time = et.substring(0, m != -1 ? m : et.length);

														 console.log(res.body.value[j].Subject+'\n');
														arr.push("{ title:'"+res.body.value[j].Subject+"'");
														arr.push("start:'"+start+"'");
														arr.push("start_time:'"+start_time+"'");
														arr.push("end:'"+end+"'");
														arr.push("end_time:'"+end_time+"'}");
													  }
													  //res.body.value[j].Location.DisplayName.toString()
													  var myarr='['+arr+']';
													  console.log(myarr);
														response.render('calendar',{userid:userid,name:name,email:email,myfile:myfile,outevents:myarr,page_title:'Calendar',outlookauth:'active',googleauth:''});

												  }
												}
											});
										} //if close
										else if(google_access!='')
										{
											console.log('only google');
											//--------google-----------------
													var oauth2Client = getOAuthClient();
													oauth2Client.setCredentials({ access_token:google_access,refresh_token:google_refresh});
													var calendar = google.calendar('v3');
													calendar.events.list({
													/*  
													calendar.events.watch({
													auth: oauth2Client,
													 resource: {
														id: "12345",  //unique channel id -self made
														type: 'web_hook',
														address: 'https://xyz.com'
													 },
													calendarId: 'primary' */
													auth: oauth2Client,
													calendarId: 'primary',
													//timeMin: (new Date()).toISOString(),
													//maxResults: 10,
													singleEvents: true,
													orderBy: 'startTime'

													}, function(err, googleres) {
													if (err) {
														console.log('The API returned an error: ' + err);
														return;
													}
													var events = googleres.items;
													if (events.length == 0) {
													console.log('No upcoming events found.');
													} else {
													console.log('Upcoming 10 events:');
													var narr=[];

													for(var i=0;i<events.length;i++){
														narr.push("{title:'"+events[i].summary+"'");
														narr.push("start:'"+events[i].start.dateTime+"'");
														narr.push("end:'"+events[i].end.dateTime+"'}");

													}
													var mainarr='['+narr+']';
														console.log(mainarr);
													}
													response.render('Calendar',{userid:userid,name:name,email:email,myfile:myfile,gevents:mainarr,page_title:'Calendar',googleauth:'active',outlookauth:''});
													
													});
									
														// google end
										}
										else
										{
											console.log('no outlook no google-my calendar');
											response.render('Calendar',{userid:userid,name:name,email:email,myfile:myfile,page_title:'Calendar',outlookauth:'',googleauth:''});
										}
									//-----------------
								}else
								{
									console.log('no data found');
								}
							}
						});
						
			}
			else
			{
				console.log('no session userid');
				response.redirect('/');
			}
		

	});
	app.get('/sign_up',function(request,response){

	 	response.render('sign_up');   
	});

	app.post('/sign_in',function(request,response){
		console.log(request.body.email);
		console.log(request.body.pwd);
		var email=request.body.email;
		var pwd=md5(request.body.pwd);	
	
					console.log('connected');
					var query="SELECT * FROM user WHERE email='"+email+"' AND pwd='"+pwd+"'";
					con.query(query,function(err,result){
							if(err)
							{
								console.log('\ndberror:'+err);
							}
							else
							{
								//console.log(result);
								if(result.length==1)
								{
									var name=result[0].name;
									var userid=result[0].id;
									var myfile=result[0].myfile;
									var role=result[0].role;
									var logged_date=result[0].logged_date;
									request.session.userid=userid;
									request.session.myfile=myfile;
									request.session.name=name;
									request.session.email=email;
									request.session.role=role;

									//var datetime = new Date(Date.now()).toLocaleString();
									var datetime = new Date(Date.now()).toLocaleDateString();
									
									console.log(datetime);
									if(datetime==logged_date)
									{
										var query_new="UPDATE user set logged_in=1,logged_date='"+datetime+"' WHERE id='"+userid+"'";
										con.query(query_new,function(err,result){
											response.redirect('/dashboard');
										});
									}
									else
									{
										var query_new="UPDATE user set logged_in=1,logged_date='"+datetime+"',outlook_access='',google_access='',outlook_mail='',google_refresh='' WHERE id='"+userid+"'";
										con.query(query_new,function(err,result){
											response.redirect('/dashboard');
										});
									}
									
									//response.render('dashboard',{name:name,email:email});  
								}else
								{
									 //response.send();
									 response.render('index',{msg:'Please provide correct email-id and password.'});  
									 
								}
							}

					});
				

	});
	app.get('/dashboard',function(request,response){
		//console.log(request.session);
		if (request.session.userid) 
		{
			var userid=request.session.userid;	
			var name=request.session.name;	
			var email=request.session.email;
			var role=request.session.role;
			var query="SELECT * FROM user WHERE id='"+userid+"'";
			var query2="SELECT * FROM user WHERE logged_in=1 AND id!='"+userid+"'";
					con.query(query,function(err,result){
							if(err)
							{
								console.log('\ndberror:'+err);
							}else
							{
								//console.log(result);
								if(result.length==1)
								{

									var myfile=result[0].myfile;
									request.session.myfile=myfile;
									google_access=result[0].google_access;
									google_refresh=result[0].google_refresh;
									outlook_access=result[0].outlook_access;
									outlook_mail=result[0].outlook_mail;
									if((google_access==null)||(google_access==''))
									{
										console.log('empty google access');
										google_access='';
									}
									if((outlook_access==null)||(outlook_access==''))
									{
										console.log('empty outlook access');
										outlook_access='';
									}
									con.query(query2,function(err,results){
											if(err)
											{
												console.log('\ndberror:'+err);
											}else
											{
												//console.log(results);
												if(results.length>0)
												{
													
													//console.log(results);
													response.render('dashboard',{name:name,email:email,userid:userid,myfile:myfile,onlineuser:results,role:role,googleauth:google_access,outlookauth:outlook_access});  
												}
												else
												{
													response.render('dashboard',{name:name,email:email,userid:userid,myfile:myfile,role:role,googleauth:google_access,outlookauth:outlook_access});  
												}
											}
										});
								}
								
							}
						});
			
				
		}
		else
		{
			response.redirect('/'); 
		}
	 	  
	});

	app.get('/sign_out',function(request,response){
		if (request.session.userid) 
		{
			var query_new="UPDATE user set logged_in=0 WHERE id='"+request.session.userid+"'";
			con.query(query_new,function(err,result){
				request.session.destroy();
			response.redirect('/');
			});
									
			
				
		}
		else
		{
			response.redirect('/');
		}
	});

	app.post('/quick_update',function(request,response){
		var email=request.body.email;
		var userid=request.body.userid;
		var name=request.body.name;
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
				var sql1="UPDATE user SET name='"+name+"',email='"+email+"',myfile='"+filename+"' WHERE id = '"+userid+"'";
				con.query(sql1,function(err,result){
							if(err)
							{
								console.log('\ndberror:'+err);
							}else
							{
								if(result.affectedRows==1)
								{
									 
									response.send('Your data updated successfully');
								}else
								{
									 response.send('Something is wrong.');
									 
								}
							}

					});
		}

		})
	});

	app.get('/change_pwd',function(request,response){
		var userid=request.session.userid;	
		var name=request.session.name;	
		var email=request.session.email;
		var myfile=request.session.myfile;
		response.render('change_pwd',{userid:userid,name:name,email:email,myfile:myfile})
	});

	app.post('/quick_change_pwd',function(request,response){
			var pwd=md5(request.body.newpwd);
			var userid=request.body.userid;
			//console.log(pwd);
			//console.log(userid);
			var sql1="UPDATE user SET pwd='"+pwd+"' WHERE id = '"+userid+"'";
				con.query(sql1,function(err,result){
							if(err)
							{
								console.log('\ndberror:'+err);
							}else
							{
								if(result.affectedRows==1)
								{
									 
									response.send('updated');
								}else
								{
									 response.send('Something is wrong.');
									 
								}
							}

					});
	});

	app.get("/p2p",function(request,response){
		console.log(request.param('to'));
		var userid=request.session.userid;	
		var name=request.session.name;	
		var email=request.session.email;
		var myfile=request.session.myfile;
		var user1=request.session.name;	
		var user2=request.param('to');
		user2 = user2.replace(/["']/g, "");
		var room_name='privateroom'+user1+'_'+user2;

						var query1="SELECT * FROM private_room_tbl WHERE (user1 ='"+user1+"' and user2='"+user2+"') or(user1 ='"+user2+"' and user2='"+user1+"')";
						con.query(query1,function(err,result1){
							
							if(err)
								{
									console.log('\ndberror:'+err);
								}else
								{
									//console.log(result1);

									if(result1.length==1)
									{
										console.log(result1[0].room);
										
										response.render('p2pchat',{user1:user1,room:result1[0].room,userid:userid,name:name,email:email,myfile:myfile});
										//response.send('Your data registered successfully');
									}
									 else
									{
										con.query("INSERT INTO private_room_tbl (user1, user2,room) VALUES ('"+user1+"', '"+user2+"','"+room_name+"')",function(err,result){
												if(err)
												{
													console.log('\ndberror:'+err);
												}else
												{
													if(result.affectedRows==1)
													{
														response.render('p2pchat',{user1:user1,room:room_name,userid:userid,name:name,email:email,myfile:myfile});
														//response.send('Your data registered successfully');
													}
												}

										});
									}
								
								}

						});
						
				
		
	});
	/* ---------jquery ajax type1----------------------------------------------------
	app.post('/quick_register',express.bodyParser(), function(req,res){
		console.log('body: ' + JSON.stringify(req.body));
		console.log(req.body.name);
		console.log(req.body.email);
	}); 

	app.post('/quick_login',express.bodyParser(), function(request,response){
		//console.log(request.body.email);
			request.session.email=request.body.email;
			//response.locals.email = request.session.email;
			app.locals.email=request.session.email;

		response.send('logged in successfully');

	});
	--------------------------------------------------------------------------------*/
	/* ---------jquery ajax type2:preventing form submition(best)------------------*/
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
					console.log('connected');
					con.query("INSERT INTO User (name, email,myfile,pwd,role) VALUES ('"+name+"', '"+email+"','"+filename+"','"+pwd+"','parent')",function(err,result){
							if(err)
							{
								console.log('\ndberror:'+err);
							}else
							{
								if(result.affectedRows==1)
								{
									 //response.redirect('/');
									response.send('Your data registered successfully');
								}
								else
								{
									 response.send('Something is wrong.');
									 
								}
							}

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
	/*--------------------------------end jquery ajax-------------------------------------------*/

	
	
	// socket for chat
		io.on('connection', function(socket){
			console.log('a user connected');
			socket.on('newuser', function(username,room){
			
					socket.join(room);
					socket.username=username;
					socket.myroom=room;
					console.log(username+'added');
					//socket.nou=io.engine.clientsCount;
					//socket.broadcast.emit(username+'joined..');
					//io.to(room).emit('showchat', username,socket.nou);
				
			});

			// socket.on('newroom',function(room){
					
			// 		console.log(io.sockets.adapter.rooms);
			// 		io.to(room).emit('showroommsg','Welcome to all in room');
			// });

			socket.on('sendmsg', function(msg){
		    	
		    	console.log('message: '+ socket.username);

		    	io.to(socket.myroom).emit('showchat', socket.username,socket.nou,msg);
		  	});

			socket.on('disconnect', function(){
		    console.log('user disconnected');
		 	 });

		});
		

	app.get('/p2p_sock',function(request,response){
		var userid=request.session.userid;	
		var name=request.session.name;	
		var email=request.session.email;
		var myfile=request.session.myfile;
		var user1=request.session.name;	
		var user2=request.param('to');
		user2 = user2.replace(/["']/g, "");
		console.log(request.param('to'));

			var room_name='privateroom'+user1+'_'+user2;

						var query1="SELECT * FROM sock_private_room_tbl WHERE (user1 ='"+user1+"' and user2='"+user2+"') or(user1 ='"+user2+"' and user2='"+user1+"')";
						con.query(query1,function(err,result1){
							
							if(err)
								{
									console.log('\ndberror:'+err);
								}else
								{
									//console.log(result1);

									if(result1.length==1)
									{
										//console.log(result1[0].room);
										
										response.render('p2p_sock',{user1:user1,room:result1[0].room,userid:userid,name:name,email:email,myfile:myfile});
										//response.send('Your data registered successfully');
									}
									 else
									{
										con.query("INSERT INTO sock_private_room_tbl (user1, user2,room) VALUES ('"+user1+"', '"+user2+"','"+room_name+"')",function(err,result){
												if(err)
												{
													console.log('\ndberror:'+err);
												}else
												{
													if(result.affectedRows==1)
													{
														response.render('p2p_sock',{user1:user1,room:room_name,userid:userid,name:name,email:email,myfile:myfile});
														//response.send('Your data registered successfully');
													}
												}

										});
									}
								
								}

						});
						
	
	});

	app.post('/createuser',function(request,response){
		var username=request.body.username;
		var room_name=request.body.optradio;
		request.session.user=username;
		console.log(request.session.user);
		// db connnect

						var sql="UPDATE temp_user_status SET logged_in=1 WHERE username = '"+username+"'";
						con.query(sql,function(err,result){
								if(err)
								{
									console.log('\ndberror:'+err);
								}
								else
								{
									
								 response.render('firechat',{username:username,room:room_name});
									
								}

						});
				

		
		//console.log(request.body.username);

	});

	app.post('/createuser_private',function(request,response){
			var user1=request.body.username;
		var user2=request.body.optradio;
		request.session.user=user1;
		console.log(request.session.user);
		var room_name='privateroom'+user1+user2;
		var con=mysql.createConnection({
					host:'localhost',
					user:'root',
					password:'esfera',
					database: "mktestnp_db"
				})

				con.connect(function(err)
				{
					if(err)
					{
						console.log(err);
					}
					else
					{
						console.log('connected');
						var query1="SELECT * FROM private_room_tbl WHERE (user1 ='"+user1+"' and user2='"+user2+"') or(user1 ='"+user2+"' and user2='"+user1+"')";
						con.query(query1,function(err,result1){
							
							if(err)
								{
									console.log('\ndberror:'+err);
								}else
								{
									console.log(result1);

									if(result1.length==1)
									{
										console.log(result1[0].room);
										
										response.render('firechat_private',{user1:user1,room:result1[0].room});
										//response.send('Your data registered successfully');
									}
									 else
									{
										con.query("INSERT INTO private_room_tbl (user1, user2,room) VALUES ('"+user1+"', '"+user2+"','"+room_name+"')",function(err,result){
												if(err)
												{
													console.log('\ndberror:'+err);
												}else
												{
													if(result.affectedRows==1)
													{
														response.render('firechat_private',{user1:user1,room:room_name});
														//response.send('Your data registered successfully');
													}
												}

										});
									}
								
								}

						});
						
					}
				});
		

	});

	app.post('/register',function(request,response){
		//console.log(request);
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
				// db connnect
				var con=mysql.createConnection({
					host:'localhost',
					user:'root',
					password:'esfera',
					database: "mktestnp_db"
				})

				con.connect(function(err)
				{
					if(err)
					{
						console.log(err);
					}
					else
					{
						console.log('connected');
						con.query("INSERT INTO User (name, email,myfile,pwd) VALUES ('"+name+"', '"+email+"','"+filename+"','"+pwd+"')",function(err,result){
								if(err)
								{
									console.log('\ndberror:'+err);
								}else
								{
									if(result.affectedRows==1)
									{
										 
										 response.render('index', { msg:'Your data registered successfully.'});

										//response.send('Your data registered successfully');
									}else
									{
										 response.render('index', { msg:'Something is wrong.'});
										 
									}
								}

						});
					}
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

	
		 
