// model function1
exports.userexist = async function(email,pwd,url,MongoClient, cb) {
		MongoClient.connect(url,function(err,db){
			var myobj= { $and: [ {email:email}, {pwd:pwd} ] };
			//var myobj= { email:email};
			  db.collection("users").findOne(myobj, function(err, result) {
			  	if(err)
			  	{
			  		cb(true,err);
			  	}
			  	else
			  	{
			  		
			  		cb(false,result);
			  	}
			});
		});
}


// model function2
exports.register_user = async function(name,email,myfile,pwd,role,url,MongoClient,cb) {
		MongoClient.connect(url, function(err, db) {
			  if (err) throw err;
			  var myobj = { name:name,email: email,myfile:filename,pwd:pwd,role:role };
			  db.collection("users").insertOne(myobj, function(err, res) {
			    if (err)
			    {
			    	 cb(true,err);
			    }
			    else
			    {
			    	var msg="Your data registered successfully";
			    	cb(false,msg);
			    }
			  });
		});
}


//model function3
exports.update_user = async function(email,filename,url,MongoClient,cb) {

		MongoClient.connect(url,function(err,db){
		if(err) throw err;
		db.collection("users").findOneAndUpdate({email:email},{$set: {myfile:filename}},function(err,result){
		if(err)
		{   
			var msg='Something wrong when updating data!';
			cb(true,msg);	 
		}
		else
		{
			if(result)
			{
				console.log(result);   //return updated data  -only in findOneAndUpdate  query
				console.log(result.lastErrorObject.updatedExisting);  //true--updated and false
				cb(false,result);
			}
			else
			{
				cb(false,result);
			}

		}

		});
		});
}


//model function4
exports.update_pwd_user = async function(email,pwd,url,MongoClient,cb) {
		MongoClient.connect(url,function(err,db){
				db.collection("users").update({email:email},{$set:{pwd:pwd}},function(err,result){
					if(err)
					{
						cb(true,err);
					}
					else
					{
						cb(false,result);
					}
				});
			}); 
}
