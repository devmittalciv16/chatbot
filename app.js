const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const accountSid = "AC1c09f24d54bf4637bed1da816f47d468";
const authToken = "646b8246eeb1ea4c51d47162cac647c8";
const twilioWhatsappNumber = "+14155238886";
const client = require("twilio")(accountSid, authToken);
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/inbound", (req, res) => {
	console.log("yo!");
	client.messages
		.create({
			from: "whatsapp:+14155238886",
			body: "Ahoy world!",
			to: "whatsapp:+918118852110",
		})
		.then((message) => console.log(message.sid));
	res.end("hello");
});

app.listen(3000, () => {
	console.log("server connected");
});
