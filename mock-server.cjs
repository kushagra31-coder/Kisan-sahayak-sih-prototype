const express = require("express");
const app = express();
app.use(express.json());

app.post("/webhooks/rest/webhook", (req, res) => {
  console.log("Received webhook:", req.body);
  res.json([{ recipient_id: req.body.sender || "test", text: "Hello from mock backend!" }]);
});

app.listen(5005, () => console.log("Mock server listening on http://localhost:5005"));
