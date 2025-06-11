let socket = io();

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
		"guest home", 
		"Circular Brackets", 
		"/GuestHome/index.html", 
		[], 
		["/GuestHome/script.js"]
	), 

	new Page(
		"user home", 
		"Circular Brackets - Logged In", 
		"/UserHome/index.html", 
		[], 
		["/UserHome/script.js"]
	)
];

let content = null;

const stylesheets = [];
const activeScripts = [];
const activeListeners = [];
const socketListeners = [];
let loadedScriptsElem = null;

function clearCurrentPage() {
	content.innerHTML = "";
	document.body.style.backgroundColor = "rgb(50, 50, 50)";

	for(let listener of activeListeners) {
		listener.el.removeEventListener(
			listener.type, 
			listener.handler
		);
	}

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

window.onload = () => {
	socket.on("connect", () => {
		content = document.querySelector("#mainContent");
		loadedScriptsElem = document.querySelector("#loadedScripts");

		loadPage("guest home");
	});
}