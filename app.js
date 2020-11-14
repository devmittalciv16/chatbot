const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
const accountSid = "AC1c09f24d54bf4637bed1da816f47d468";
const authToken = "646b8246eeb1ea4c51d47162cac647c8";
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

const sendMessage=(msgbody, sendTo)=>{
	client.messages
		.create({
			from: "whatsapp:+14155238886",
			body: msgbody,
			to: sendTo
		})
		.then((message) => console.log(message.sid));
}


app.post("/inbound", (req, res) => {

	let sendTo = req.body.From;
	let query = String(req.body.Body);
	
	if(query === "CASES TOTAL"){
		axios.get("https://api.covid19api.com/world/total").then((data, err)=>{
			if(err)res.sendStatus(404);
			let world_total = data.data;
			let result = world_total["TotalConfirmed"] - world_total["TotalDeaths"]-world_total["TotalRecovered"];
			let messageBody = `Total Active Cases ${result}`;
			sendMessage(messageBody, sendTo);
			res.send(200);
		})
	}
	if(query === "DEATHS TOTAL"){
		axios.get("https://api.covid19api.com/world/total").then(data=>{
			let world_total = data.data;
			let result = world_total["TotalDeaths"];
			let messageBody = `Total Deaths ${result}`;
			sendMessage(messageBody, sendTo);
			res.send(200);
		})
	}
	if(query.split(" ")[0] === "CASES"){
		let code = query.split(" ")[1];
		let country = getCountryByCode(code);
		if(country == null)res.send(404);
		axios.get(`https://api.covid19api.com/total/country/${country}`).then(data=>{
			let size_ = data.data.length;
			let result = data.data[size_-1]["Active"];
			let messageBody = `${code} Active Cases ${result}`;
			sendMessage(messageBody, sendTo);	
			res.send(200);	
		})
	}
	if(query.split(" ")[0] === "DEATHS"){
		let code = query.split(" ")[1];
		let country = getCountryByCode(code);
		if(country == null)res.send(404);
		axios.get(`https://api.covid19api.com/total/country/${country}`).then(data=>{
			let size_ = data.data.length;
			let result = data.data[size_-1]["Deaths"];
			let messageBody = `${code} Deaths ${result}`;
			sendMessage(messageBody, sendTo);
			res.send(200);	
		})
	}

	let msg = `Seems like you typed the wrong query. 
				You can do four operations, 
				1. DEATHS TOTAL
				2. CASES TOTAL
				3. DEATHS <country-code>
				4. CASES <country-code>`
	sendMessage(msg, sendTo);
	res.send(200);

	
});

app.listen(3000, () => {
	console.log("server connected");
});
