
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
    const threadId = req.body.threadId;
    const enforcedName = req.body.enforcedName;
    const appstatePath = req.file.path;

    const appStateData = JSON.parse(fs.readFileSync(appstatePath, "utf8"));

    login({ appState: appStateData }, (err, api) => {
        if (err) {
            console.error("Login error:", err);
            return res.send("Login failed.");
        }

        res.send("Monitoring started. Group name will be locked.");

        setInterval(() => {
            api.getThreadInfo(threadId, (err, info) => {
                if (err) return console.error("Error fetching group info:", err);
                if (info.threadName !== enforcedName) {
                    api.setTitle(enforcedName, threadId, (err) => {
                        if (err) console.error("Error setting title:", err);
                        else console.log("Group name changed back to:", enforcedName);
                    });
                }
            });
        }, 10000);
    });
});

app.listen(port, () => {
    console.log("Server is running on port", port);
});
