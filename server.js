const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

let playoffTeams = null;

const bracketDeadline = new Date("July 21, 2025 00:00:00");

// add static files
app.use(express.static(__dirname + "/Client"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

async function getKeyFile() {
    try {
        return await fs.readFile("Data/key.txt", "utf8");
    }
    catch(error) {
        console.log((new Date()).toString());
        console.log("\tERROR getting keyfile:");
        console.log(`\t${error.message}`);

        return null;
    }
}

async function run() {

const keyFile = await getKeyFile();
const key = Buffer.from(keyFile, "hex");
const algorithm = "aes-256-cbc";
const iv = crypto.randomBytes(16);

function encrypt(text) {
    let cipher = crypto.createCipheriv(
        algorithm, 
        Buffer.from(key), 
        iv
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return {
        iv: iv.toString("hex"), 
        encryptedData: encrypted.toString("hex")
    };
}

function decrypt(text) {
    let iv = Buffer.from(text.iv, "hex");
    let encryptedText = Buffer.from(text.encryptedData, "hex");
    let decipher = crypto.createDecipheriv(
        algorithm, 
        Buffer.from(key), 
        iv
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
}

const validationSettings = {
    username: {
        allowedChars: "abcdefghijklmnopqrstuvwxyz0123456789_-", 
        minLength: 1, 
        maxLength: 20
    }, 
    password: {
        minLength: 10, 
        maxLength: 30
    }
}

function validateSignup(username, password) {
    if((typeof username) !== "string") {
        return {result: false, reason: "username not string"};
    }

    if((typeof password) !== "string") {
        return {result: false, reason: "password not string"};
    }

    if(username.length < validationSettings.username.minLength) {
        return {result: false, reason: "username too short"};
    }

    if(username.length > validationSettings.username.maxLength) {
        return {result: false, reason: "username too long"};
    }

    for(let c of username.toLowerCase()) {
        if(!(validationSettings.username.allowedChars.includes(c))) {
            return {result: false, reason: "username has invalid character"};
        }
    }

    if(password.length < validationSettings.password.minLength) {
        return {result: false, reason: "password too short"};
    }

    if(password.length > validationSettings.password.maxLength) {
        return {result: false, reason: "password too long"};
    }

    return {result: true, reason: ""};
}

async function isFile(filePath) {
    try {
        const stat = await fs.lstat(fileName)
        return stat.isFile();
    }
    catch (error) {
        return false;
    }
}

async function checkForUsernameNotTaken(username) {
    const directory = path.join(__dirname, "/Data/User");

    if(
        (username === undefined) || 
        (username === null)
    ) {
        return {result: false, reason: "invalid username"};
    }

    try {
        const files = await fs.readdir(directory);

        const existingUsers = files
            .map(fileName => {
                return path.join(directory, fileName);
            })
            .filter(isFile)
            .map(file => {
                const baseName = path.basename(file);
                return path.parse(baseName).name;
            })
        ;

        if(existingUsers.length > 50) {
            return {result: false, reason: "too many users"};
        }

        if(existingUsers.includes(username)) {
            return {result: false, reason: "username taken"};
        }

        return {result: true, reason: ""};
    }
    catch(error) {
        console.log((new Date()).toString());
        console.log("\tERROR checking for username not taken:");
        console.log(`\t${error.message}`);

        return {result: false, reason: "server error"};
    }
}

async function createAccount(usernameInput, passwordInput, socket) {
    const fileData = {
        username: usernameInput, 
        password: encrypt(passwordInput), 
        points: 0, 
        bracket: null
    };
    const file = JSON.stringify(fileData);

    try {
        await fs.writeFile(
            `Data/User/${usernameInput}.json`, 
            file, 
            "utf8"
        );

        socket.emit("signup success");
    }
    catch(error) {
        console.log((new Date()).toString());
        console.log("\tERROR creating account:");
        console.log(`\t${error.message}`);

        socket.emit("signup failed", "server error");
        return;
    }
}

async function handleRequestSignup(socket, inputs) {
    const valid = validateSignup(inputs.username, inputs.password);

    if(!(valid.result)) {
        socket.emit("signup failed", valid.reason);
        return;
    }

    const usernameNotTakenCheck = await checkForUsernameNotTaken(
        inputs.username
    );

    if(!(usernameNotTakenCheck.result)) {
        socket.emit(
            "signup failed", 
            usernameNotTakenCheck.reason
        );

        return;
    }

    createAccount(
        inputs.username, 
        inputs.password, 
        socket
    );
}

async function handleRequestLogin(socket, inputs) {
    const usernameNotTakenCheck = await checkForUsernameNotTaken(
        inputs.username
    );

    if(usernameNotTakenCheck.result) {
        socket.emit("login failed", "account doesn't exist");
        return;
    }
    else if(
        !(usernameNotTakenCheck.result) && 
        (usernameNotTakenCheck.reason == "username taken")
    ) {
        try {
            const file = await fs.readFile(`Data/User/${inputs.username}.json`);
            
            const fileData = JSON.parse(file);
            const passwordCheck = fileData.password;
            const decrypted = decrypt(passwordCheck);

            if(decrypted == inputs.password) {
                socket.emit("login success");
            }
            else {
                socket.emit("login failed", "incorrect password");
            }
        }
        catch(error) {
            console.log((new Date()).toString());
            console.log("\tERROR logging in:");
            console.log(`\t${error.message}`);

            socket.emit("login failed", "server error");
            return;
        }
    }
    else {
        socket.emit("login failed", usernameNotTakenCheck.reason);
        return;
    }
}

async function handleCheckLoggedIn(socket, localStorageValue) {
    if(localStorageValue === null) {
        socket.emit("not logged in");
        return;
    }

    const usernameNotTakenCheck = await checkForUsernameNotTaken(
        localStorageValue
    );

    if(
        !(usernameNotTakenCheck.result) && 
        (usernameNotTakenCheck.reason == "username taken")
    ) {
        socket.emit("logged in");
        return;
    }

    socket.emit("not logged in");
}

async function handleGetMatchups(socket) {
    try {
        const matchups = JSON.parse(
            await fs.readFile("Data/Global/Results.json")
        );

        socket.emit("send matchups", matchups);
    }
    catch(error) {
        console.log((new Date()).toString());
        console.log("\tERROR checking for username not taken:");
        console.log(`\t${error.message}`);

        socket.emit("send matchups", null);
    }
}

async function handleSendBracket(socket, username, bracket) {
    try {
        let userData = JSON.parse(await fs.readFile(`Data/User/${username}.json`));
        userData.bracket = bracket;

        await fs.writeFile(
            `Data/User/${username}.json`, 
            JSON.stringify(userData)
        );
    }
    catch(error) {
        console.log((new Date()).toString());
        console.log("\tERROR creating bracket:");
        console.log(`\t${error.message}`);

        socket.emit("bracket creation failed");
        return;
    }
}

async function handleCheckForBracket(socket, username) {
    try {
        const userData = JSON.parse(await fs.readFile(`Data/User/${username}.json`));

        socket.emit(
            "bracket check result", 
            (userData.bracket !== null)
        );
    }
    catch(error) {
        console.log((new Date()).toString());
        console.log("\tERROR checking for bracket:");
        console.log(`\t${error.message}`);

        socket.emit("bracket check failed");
        return;
    }
}

async function getLeaderbaord() {
    leaderboard = [];

    try {
        const directory = path.join(__dirname, "/Data/User");
        const files = await fs.readdir(directory);

        const userFiles = files
            .map(fileName => {
                return path.join(directory, fileName);
            })
            .filter(isFile)
        ;

        for(let file of userFiles) {
            const data = JSON.parse(await fs.readFile(
                file, 
                "utf8"
            ));

            if(data.bracket !== null) {
                leaderboard.push({
                    username: data.username, 
                    points: data.points
                });
            }
        }

        const compare = (a, b) => {
            return a.points - b.points;
        }
        
        leaderboard.sort(compare);

        return leaderboard;
    }
    catch(error) {
        console.log((new Date()).toString());
        console.log("\tERROR getting leaderboard:");
        console.log(`\t${error.message}`);

        return [];
    }
}

let leaderboard = [];
await getLeaderbaord();

// handle users
io.on("connection", (socket) => {
    socket.emit("send bracket deadline", bracketDeadline);

    socket.on("check logged in", (localStorageValue) => {
        handleCheckLoggedIn(socket, localStorageValue);
    });

    socket.on("request signup", (inputs) => {
        handleRequestSignup(socket, inputs);
    });

    socket.on("request login", (inputs) => {
        handleRequestLogin(socket, inputs);
    });

    socket.on("request leaderboard", () => {
        socket.emit("send leaderboard", leaderboard);
    });

    socket.on("get matchups", () => {
        handleGetMatchups(socket);
    });

    socket.on("send bracket", (data) => {
        handleSendBracket(socket, data.username, data.bracket);
    });

    socket.on("check for bracket", (username) => {
        handleCheckForBracket(socket, username);
    });
});

// start server
server.listen(3002, () => {
  console.log("server started on http://localhost:3002");
});
}

run();