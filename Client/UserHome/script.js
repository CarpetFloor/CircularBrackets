activeScripts.push(() => {
	document.querySelector("#usernameDisplay").innerText += 
		" " + 
		localStorage.getItem("loggedIn")
	;

	document.querySelector("#logoutButton").addEventListener(
		"click", 
		() => {
			localStorage.setItem("loggedIn", null);
			loadPage("guest home");
		}
	);

	socket.emit("check for bracket", localStorage.getItem("loggedIn"));

	socketListeners.push("bracket check result");
	socket.on("bracket check result", (created) => {
		if(created) {
			const p = document.createElement("p");
			p.className = "bracketCreatedNotice";
			p.innerText = "You have already created a bracket";

			document.querySelector(".main").appendChild(p);
		}
		else {
			const button = document.createElement("button");
			button.id = "createBracketButton";
			button.innerText = "Create Bracket";

			document.querySelector(".main").appendChild(button);

			document.querySelector("#createBracketButton").
				addEventListener(
					"click", 
					() => {
						loadPage("create bracket");
					}
				)
			;

		}
	});

	socketListeners.push("bracket check failed");
	socket.on("bracket check failed", () => {
		window.alert("server error checking if created bracket");
	})
});

activeScripts.at(-1)();