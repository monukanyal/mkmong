module.exports = (app, config,MongoClient) => {
		app.get('/mongo_logout',function(req,res){
			req.session.destroy();
			res.redirect('/');
		});
}