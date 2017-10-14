// model function1
exports.getuserdetail = async function(email,url,MongoClient, cb) {
		MongoClient.connect(url,function(err,db){
				if (err) throw err;
				var myobj={email:email};
				db.collection("users").findOne(myobj,function(err,result){
					if(err)
					{
					  cb(true,err);
					}
					else
					{
						cb(false,result);
							/*MongoClient.connect(url,function(err,db){
								if (err) throw err;
								db.collection("users").find({role:'user'}).toArray(function(nerr,newresult){
									if(nerr) throw nerr;
									//console.log('all\n');
									console.log(newresult);
									cb(false,newresult);
									res.render('dashboard',{name:name,email:email,userid:userid,myfile:req.session.myfile,role:role,list:newresult}); 
								});		
							}); */
					}
				});
			});
}