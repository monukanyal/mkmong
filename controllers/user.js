var express = require('express');
var md5=require('md5');
var user_model = require('../models/user');  //load model
module.exports = (app, config,MongoClient) => {
 		
 		app.post('/quick_update',function(request,response){
 		var url=config.db_url;
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

					 user_model.update_user(email,filename,url,MongoClient, function (err, result) {
					 	if(err)
					 	{
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

				}
			});
		}
		else
		{
			response.redirect('/');
		}
	});
		 app.get('/change_pwd',function(request,response){
		 		var url=config.db_url;
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
			var url=config.db_url;
			var pwd=md5(request.body.newpwd);
			var userid=request.body.userid;
			var email=request.session.email;
			//console.log(pwd);
			//console.log(userid);
			user_model.update_pwd_user(email,pwd,url,MongoClient, function (err, result) {
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

	app.post('/quick_delete_user',express.bodyParser(),function(req,res){
			
		//console.log('body: ' + JSON.stringify(req.body));
		var url=config.db_url;
		console.log(req.body.email);
		console.log(req.body.id);
		var userid=req.body.id;
		MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  var myquery = { _id: new mongodb.ObjectID(userid) };
		  db.collection("users").deleteOne(myquery, function(err, obj) {
		    if (err) throw err;
		    res.send('1 user/tuple deleted');
		    //console.log("1 user/doc deleted");
		    db.close();
		  });
		});
	});
}