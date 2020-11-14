const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
const accountSid = "AC976f1515629124710e74ba3638a42072";
const authToken = "37e7435fdacd64e0492b5ea6c303c4f4";
const twilioWhatsappNumber = "+14155238886";
const client = require("twilio")(accountSid, authToken);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
let countryArray = {};
countryArray["IN"] = "india";

const fillCountryArray = ()=>{
	axios.get("https://api.covid19api.com/countries").then(data=>{
		let countries = data.data;
		let size = countries.length;
		for(let i=0;i<size;i++){
			countryArray[countries[i]["ISO2"]] = countries[i]["Slug"];
		}
	})
}
fillCountryArray();

const getCountryByCode = (code)=>{
	return countryArray[code];
}

const sendMessage = (messageBody, sendTo)=>{
	client.messages
	.create({
		from: "whatsapp:+14155238886",
		body: messageBody,
		to: sendTo
	}).then(data=>console.log(data));
}


app.post("/inbound", (req, res) => {

	let sendTo = req.body.From;
	let query = req.body.Body;
	let messageBody="null";
	
	if(!sendTo){
		res.sendStatus(200);
		return;
	}


	if(query === "CASES TOTAL"){
		axios.get("https://api.covid19api.com/world/total").then((data, err)=>{
			if(err)res.sendStatus(404);
			let world_total = data.data;
			let result = world_total["TotalConfirmed"] - world_total["TotalDeaths"]-world_total["TotalRecovered"];
			messageBody = `Total Active Cases ${result}`;
			sendMessage(messageBody, sendTo);
		})
	}else if(query === "DEATHS TOTAL"){
		axios.get("https://api.covid19api.com/world/total").then(data=>{
			let world_total = data.data;
			let result = world_total["TotalDeaths"];
			messageBody = `Total Deaths ${result}`;
			sendMessage(messageBody, sendTo);
		})
	}else if(query.split(" ")[0] === "CASES"){
		let code = query.split(" ")[1];
		let country = getCountryByCode(code);
		if(country == null)res.send(404);
		axios.get(`https://api.covid19api.com/total/country/${country}`).then(data=>{
			let size_ = data.data.length;
			let result = data.data[size_-1]["Active"];
			messageBody = `${code} Active Cases ${result}`;
			sendMessage(messageBody, sendTo);
			
		})
	}else if(query.split(" ")[0] === "DEATHS"){
		let code = query.split(" ")[1];
		let country = getCountryByCode(code);
		if(country == null)res.send(404);
		axios.get(`https://api.covid19api.com/total/country/${country}`).then(data=>{
			let size_ = data.data.length;
			let result = data.data[size_-1]["Deaths"];
			messageBody = `${code} Deaths ${result}`;
			sendMessage(messageBody, sendTo);
		})
	}else if(query ==="Wakeup"){
			messageBody = `I'm awake now, you can ask covid data now`;
			sendMessage(messageBody, sendTo);
		
	}else{
		messageBody = `Seems like you typed the wrong query. 
				You can do four operations, 
				1. DEATHS TOTAL
				2. CASES TOTAL
				3. DEATHS <country-code>
				4. CASES <country-code>`
		sendMessage(messageBody, sendTo);
	}
	

	
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log("server connected");
});
