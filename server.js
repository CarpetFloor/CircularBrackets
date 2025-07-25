const express = require("express");
const app = express();
const https = require("https");
const { Server } = require("socket.io");

const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const crypto = require("crypto");

const privateKey = fsSync.readFileSync("/etc/letsencrypt/live/circularbrackets.com/privkey.pem", "utf8");
const certificate = fsSync.readFileSync("/etc/letsencrypt/live/circularbrackets.com/fullchain.pem", "utf8");
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);
const io = new Server(httpsServer);

let playoffTeams = null;

const bracketDeadline = new Date("July 21, 2025 00:00:00");

// add static files
app.use(express.static(__dirname + "/Client"));

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

	await getLeaderboard();

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

async function updateBrackets(resultsData) {
    const resultsMap = new Map();

    let roundIndex = 0;
    for(let round in resultsData) {
        for(let game of resultsData[round]) {
            let result = null;
            if(game.team1Win === true) {
                result = game.team1;
            }
            else if(game.team1Win === false) {
                result = game.team2;
            }

            resultsMap.set(
                `${roundIndex}${game.name}`, 
                result
            );
        }

        ++roundIndex;
    }

    const directory = path.join(__dirname, "/Data/User");
    const files = await fs.readdir(directory);

    const users = files
        .map(fileName => {
            return path.join(directory, fileName);
        })
        .filter(isFile)
    ;

    for(const user of users) {
        const userData = JSON.parse(await fs.readFile(user));

        if(userData.bracket !== null) {
            let points = 0;

            let roundIndex = 0;
            for(let round in userData.bracket) {
                for(let game of userData.bracket[round]) {
                    const gameId = `${roundIndex}${game.name}`;

                    const result = resultsMap.get(gameId);

                    if(result !== undefined) {
                        if(result !== null) {
                            game.correct = 
                                (result == game.prediction)
                            ;
                            
                            if(game.correct) {
                                points += 10 * Math.pow(
                                    2, 
                                    roundIndex
                                );
                            }
                        }

                    }

                }

                ++roundIndex;
            }

            userData.points = points;

            await fs.writeFile(
                user, 
                JSON.stringify(userData)
            );

            await getLeaderboard();
        }
    }
}

let lastUpdatedGame = {round: null, game: null};
async function checkForResultsUpdate() {
    const data = JSON.parse(await fs.readFile("Data/Global/Results.json"));

    let lastGame = {round: null, game: null};
    let found = false;

    let roundIndex = 0;
    for(let round in data) {
        for(let game of data[round]) {
            if(game.team1Win !== null) {
                lastGame.round = roundIndex;
                lastGame.game = game.name;
            }
        }

        ++roundIndex;
    }

    if(
        (lastGame.round != lastUpdatedGame.round) || 
        (lastGame.game != lastUpdatedGame.game)
    ) {
        lastUpdatedGame.round = lastGame.round;
        lastUpdatedGame.game = lastGame.game;

        await updateBrackets(data);
    }
}

async function handleRequestLeaderboard(socket) {
    await checkForResultsUpdate();

    socket.emit("send leaderboard", leaderboard);
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

        await getLeaderboard();
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

async function handleRequestBracketUserData(socket, username) {
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

            if(
                (data.username == username) && 
                (data.bracket !== null)
            ) {
                socket.emit("send bracket user data", data.bracket);

                return;
            }
        }
    }
    catch(error) {
        console.log((new Date()).toString());
        console.log("\tERROR getting user bracket data:");
        console.log(`\t${error.message}`);
    }
}

async function handleRequestBracketExistCheck(socket, username) {
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

            if(
                (data.username == username) && 
                (data.bracket !== null)
            ) {
                socket.emit("send bracket exists");

                return;
            }
        }
    }
    catch(error) {
        console.log((new Date()).toString());
        console.log("\tERROR getting user bracket data:");
        console.log(`\t${error.message}`);
    }
}

async function getLeaderboard() {
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

            if(
                (data.username != "SampleUser") && 
                (data.bracket !== null)
            ) {
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
await getLeaderboard();

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
        handleRequestLeaderboard(socket);
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

    socket.on("request bracket user data", (username) => {
        handleRequestBracketUserData(socket, username);
    });

    socket.on("request bracket exist check", (username) => {
        handleRequestBracketExistCheck(socket, username);
    })
});

// start server
httpsServer.listen(443, () => {console.log("Server running at https://www.circularbrackets.com");});
}

run();
