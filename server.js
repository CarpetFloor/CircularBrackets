const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const fs = require("fs");
const path = require("path");

// add static files
app.use(express.static(__dirname + "/Client"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

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

function checkForUsernameTaken(username) {
    try {
        const isFile = (fileName) => {
            return fs.lstatSync(fileName).isFile();
        };
        
        const directory = path.join(__dirname, "/Data/User");

        const existingUsers = fs.readdirSync(directory)
            .map(fileName => {
                return path.join(directory, fileName);
            })
            .filter(isFile)
            .map(file => {
                const split = file.split("\\");
                const fileName = split.at(-1);

                return (fileName.split(".json")).at(0);
            })
        ;

        if(existingUsers.includes(username)) {
            return {result: false, reason: "username taken"};
        }

        return {result: true, reason: ""};
    }
    catch(error) {
        console.log((new Date()).toString());
        console.log("\tERROR checking for username taken:");
        console.log(`\t${error.message}`);

        return {result: false, reason: "server error"};
    }
}

function createAccount(usernameInput, passwordInput, socket) {
    const fileData = {
        username: usernameInput, 
        password: passwordInput, 
        bracket: null
    };
    const file = JSON.stringify(fileData);

    fs.writeFile(
        `Data/User/${usernameInput}.json`, 
        file, 
        "utf8", 
        (error) => {
            if(error) {
                console.log((new Date()).toString());
                console.log("\tERROR creating account:");
                console.log(`\t${error.message}`);

                socket.emit("signup failed", "server error");
                return;
            }

            socket.emit("signup success");
        }
    );
}

// handle users
io.on("connection", (socket) => {
    socket.on("request signup", (inputs) => {
        const valid = validateSignup(inputs.username, inputs.password);

        if(!(valid.result)) {
            socket.emit("signup failed", valid.reason);
            return;
        }

        const usernameTakenCheck = checkForUsernameTaken(inputs.username);
        if(!(usernameTakenCheck.result)) {
            socket.emit("signup failed", usernameTakenCheck.reason);
            return;
        }

        createAccount(inputs.username, inputs.password, socket);
    })
});

// start server
server.listen(3002, () => {
  console.log("server started on http://localhost:3002");
});