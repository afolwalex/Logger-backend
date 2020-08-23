/** 
 * Configuration file for the application 
*/

const MONGODB_CONFIG = {
    URL : 	'mongodb://127.0.0.1/firstb' , 	
    OPTIONS : {
	useNewUrlParser : true , 
	useCreateIndex : true , 
	poolSize : 10 , 
	keepAlive : true , 
	useUnifiedTopology : true , 
	keepAliveInitialDelay : 300000
	}
}
module.exports = MONGODB_CONFIG