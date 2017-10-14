var md5 = require('md5');
var user_model = require('../models/user'); //loading model file
module.exports = (app, config,MongoClient) => {

	  app.get('/', (req, res) => {
	  	 res.render('index');
	  });

  	app.post('/mongo_sign_in',function(req,res){
		//console.log(req.body.email);
		var url=config.db_url;
		var email=req.body.email;
		var pwd=md5(req.body.pwd);
			//calling model function
		 user_model.userexist(email,pwd,url,MongoClient, function (err, result) {
					if(err==false)
					{  
						if(result)
						{
							//console.log(result._id);
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
					else
					{
					  res.render('index',{msg:'Something is wrong ,please try again later.'});  
					}
			  })

	});

  	app.get('/sign_up',function(request,response){
		response.render('sign_up');  
	});

	app.post('/quick_register', function(request,response){
				//console.log(req);
				var url=config.db_url;
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
					//caling model function
					user_model.register_user(name,email,myfile,pwd,'user',url,MongoClient, function (err, result) {
						if(err)
						{
							 response.send('Something is wrong.');
						}
						else
						{
							response.send(result);
							// and can send mail
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
					});
				}
			})
		});
}