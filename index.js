const http = require('http');
const https = require('https');
const port = 3000;
const server = http.createServer();
const fs = require('fs');
//wack how bot has to have actual intents there...
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
let poemInfo = '';
let count = 0;

//Discord API key
const token = "";


server.on("request", connection_handler);
function connection_handler(req, res){
	console.log(`New Request for ${req.url} from ${req.socket.remoteAddress}`);
	if(req.url === "/"){
		const main = fs.createReadStream('html/main.html');
		res.writeHead(200, {"Content-Type":"text/html"});
		main.pipe(res);
	}

	else if(req.url.startsWith("/search")){
		//should i make a landing page for the search?
		//or for a completed search
		const url = new URL(req.url, "https://localhost:3000");
		const poet = url.searchParams.get("poet");

		const main = fs.createReadStream('html/search.html');
		res.writeHead(200, {"Content-Type":"text/html"});
		main.pipe(res);
		poem_Lookup(poet);
	}

	else if(req.url.startsWith("/logedIn")){
		const url = new URL(req.url, "https://localhost:3000");
		const main = fs.createReadStream('html/logedIn.html');
		res.writeHead(200, {"Content-Type":"text/html"});
	}
	//for now and tonight i just want to make sure that i can get poetryDB wokring
	else{
		res.writeHead(404, {"Content-type":"text/html"});
		res.write("404 not found", () => res.end());
	}
}

//functionality of the bot
//first thing the bot must do is be loaded with the data that was pulled out of poetryDB

//information in the recording was wrong as well as the HTTP diagram. poetryDB infomration is held in the server.
function discord_Load_Bot_With_Poem(){
	console.log("loading up discord bot");
	//proof that this is being done async	
	client.on("ready", () =>{
		console.log("bot is working");
	});
	//gives off the author of the poem
	client.on("messageCreate", msg=>{
		if(msg.content === "!author"){
			const result = JSON.stringify(poemInfo.author);
			msg.reply(result);
		}
	})
	//gives off the title of the poem
	client.on("messageCreate", msg=>{
		if(msg.content === "!title"){
			const result = JSON.stringify(poemInfo.title);
			msg.reply(result);
		}
	})
}

function poem_Lookup(poet){
	var options;
	if(poet === ""){
		options = {
			hostname: 'poetrydb.org',
			path:'/random/1/title,author,lines.json',
			method: 'GET'
		}
	}
	//if you actually have the patience and time to figure out searching
	else{
		options = {
			hostname: 'poetrydb.org',
			path:'/random/1/title,author,lines.json',
			method: 'GET'
		}
	}
	https.get(options, (responseHTTP)=>{
		const statusCode = responseHTTP;
		let str = '';
		//code in extra things to check if the autheor actually
		responseHTTP.on('data', d=>{
			str += d;
		});
		responseHTTP.on('end', ()=>{
			console.log("poem stream ended");
			poemInfo = JSON.parse(str)[0];
			//litterally IMPOSSIBLE for there to be a race
			if(count === 0){
				//this ensures that theres only one instance of the 
				//poem information. It sends the most recent poem info
				client.login(token);
				discord_Load_Bot_With_Poem();
			}
			console.log(poemInfo);

			//just to clear it out
			count++;
		});
		responseHTTP.on('error', error=>{
			console.log(responseHTTP.error)
			console.log(error);
		})
	}).end();
}

server.on("listening", listening_handler);
function listening_handler(){

	console.log(`Now Listening on Port ${port}`);
}

//since the poem api is open shouldnt that not matter
server.listen(port);
client.login(token);