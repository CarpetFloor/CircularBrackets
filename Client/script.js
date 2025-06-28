let socket = io();

let bracketDeadline = null;

class Page {
	constructor(name, title, path, stylesheets, scripts) {
		this.name = name;
		this.title = title;
		this.path = path;
		this.stylesheets = stylesheets;
		this.scripts = scripts;
	}
}

const pages = [
	new Page(
		"home", 
		"Circular Brackets", 
		"/Home/index.html", 
		[], 
		["/Home/script.js"]
	), 

	new Page(
		"create bracket", 
		"Circular Brackets - Create Bracket", 
		"/CreateBracket/index.html", 
		["/CreateBracket/styles.css"], 
		["/CreateBracket/script.js"]
	)
];

let content = null;

const stylesheets = [];
const activeScripts = [];
const socketListeners = [];
let intervals = [];
let loadedScriptsElem = null;

function clearCurrentPage() {
	content.innerHTML = "";
	document.body.style.backgroundColor = "rgb(50, 50, 50)";

	loadedScriptsElem.innerHTML = "";

	for(let script of activeScripts) {
		activeScripts.pop();
	}

	for(let listener of socketListeners) {
		socket.removeAllListeners(listener);
	}

	for(let sheet of stylesheets) {
		sheet.remove();
	}

	for(let interval of intervals) {
		window.clearInterval(interval);
	}
}

function loadPage(name) {
	for(let page of pages) {
		if(page.name == name) {
			clearCurrentPage();

			for(let sheet of page.stylesheets) {
				const link = document.createElement("link");
				link.rel = "stylesheet";
				link.href = sheet;

				document.head.appendChild(link);
			}

			document.title = page.title;

			fetch(page.path)
				.then((res) => {return res.text()})
				.then((html) => {
					content.innerHTML = html;

					for(let script of page.scripts) {
						const scriptEl = document.createElement("script");
						scriptEl.src = script;

						loadedScriptsElem.appendChild(scriptEl);
					}

					for(let script of activeScripts) {
						script();
						console.log(script);
					}

					document.body.style.backgroundColor = "white";
				})
			;
			break;
		}
	}
}

let diff = null;
let daysDiff = null;
let hoursDiff = null;
let minutesDiff = null;

function updateTimeDiff() {
	const now = new Date();
	diff = bracketDeadline - now;
	daysDiff = Math.floor(
		diff  / 
		(1000 * 3600 * 24)
	);
	
	hoursDiff = Math.floor(
		(diff - 
			(daysDiff * (1000 * 3600 * 24))
		) / 
		(1000 * 60 * 60)
	);

	minutesDiff = Math.floor(
		(diff - 
			(daysDiff * (1000 * 3600 * 24)) - 
			(hoursDiff * (1000 * 60 * 60))
		) / 
		(1000 * 60)
	);
}

window.onload = () => {
	socket.on("connect", () => {
		socket.on("send bracket deadline", (deadline) => {
			bracketDeadline = new Date(deadline);

			updateTimeDiff();
			window.setInterval(updateTimeDiff, 1000 * 60);

			content = document.querySelector("#mainContent");
			loadedScriptsElem = document.querySelector("#loadedScripts");

			const loggedInCheck = localStorage.getItem("loggedIn");
			socket.emit("check logged in", loggedInCheck);

			loadPage("home");

			window.setInterval(() => {
				document.body.style.opacity = "1";
			}, 250);
		});
	});
}