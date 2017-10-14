var dashboard_model = require('../models/dashboard');  //load dashboard model
module.exports = (app, config,MongoClient) => {
  
		app.get('/dashboard',function(req,res){
			//console.log('Session Data:'+req.session.email);
			var url=config.db_url;
			var userid=req.session.userid;	
			var name=req.session.name;	
			var email=req.session.email;
			var role=req.session.role;
			var myfile=req.session.myfile;
			if(req.session.userid)
			{

				//calling model function
			 dashboard_model.getuserdetail(email,url,MongoClient, function (err, result) {
			 	if(err)
			 	{
			 		res.redirect('/'); 
			 	}
			 	else
			 	{
			 		req.session.myfile=result.myfile;
			 		console.log(req.session.myfile);
			 		res.render('dashboard',{name:name,email:email,userid:userid,myfile:req.session.myfile,role:role}); 
			 	}
			 });
				/*MongoClient.connect(url,function(err,db){
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
			}); */
		}
		else
		{
			res.redirect('/');
		}

		});
}