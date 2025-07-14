const express = require("express");
const multer = require("multer");
const fs = require("fs");
const login = require("fca-unofficial");
const path = require("path");

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
const upload = multer({ dest: "uploads/" });

app.post("/start", upload.single("appstate"), (req, res) => {
    const threadId = req.body.threadId;
    const enforcedName = req.body.enforcedName;

    if (!req.file) {
        return res.send("❌ No AppState file uploaded.");
    }

    const filePath = req.file.path;
    let appState;
    try {
        appState = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (err) {
        return res.send("❌ Invalid AppState file.");
    }

    login({ appState }, (err, api) => {
        if (err) {
            console.error("Login error:", err);
            return res.send("❌ Facebook login failed.");
        }

        res.send(\`✅ Monitoring started for group \${threadId} with enforced name: <b>\${enforcedName}</b>\`);

        api.setTitle(enforcedName, threadId, (err) => {
            if (err) console.log("Failed to set initial group name:", err);
        });

        api.listenMqtt((err, event) => {
            if (err) return console.log("Listen error:", err);

            if (
                event.type === "event" &&
                event.logMessageType === "log:thread-name" &&
                event.threadID === threadId
            ) {
                console.log("⚠️ Group name changed. Reverting...");

                api.setTitle(enforcedName, threadId, (err) => {
                    if (err) {
                        console.log("❌ Failed to reset group name:", err);
                    } else {
                        console.log("✅ Group name reverted to:", enforcedName);
                    }
                });
            }
        });
    });
});

app.listen(port, () => {
    console.log(\`🚀 Server running at http://localhost:\${port}\`);
});
