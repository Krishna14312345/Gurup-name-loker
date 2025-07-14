const express = require("express");
const multer = require("multer");
const fs = require("fs");
const login = require("fca-unofficial");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "uploads/" });

app.post("/start", upload.single("appstate"), (req, res) => {
  const enforcedName = req.body.enforcedName;
  const threadId = req.body.threadId;
  const appState = JSON.parse(fs.readFileSync(req.file.path, "utf8"));

  login({ appState }, (err, api) => {
    if (err) return res.send("Login failed: " + err);

    api.changeGroupName(enforcedName, threadId, (err) => {
      if (err) return res.send("Failed to change name: " + err);
      res.send("Group name locked to: " + enforcedName);
    });
  });
});

app.listen(port, () => {
  console.log("Server started on port", port);
});