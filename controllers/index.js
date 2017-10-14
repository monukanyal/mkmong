// Routes files Defined Here
module.exports = (app, config,MongoClient) => {
	require('./home')(app,config,MongoClient)
	require('./dashboard')(app,config,MongoClient)
	require('./logout')(app,config,MongoClient)
	require('./user')(app,config,MongoClient)
}


