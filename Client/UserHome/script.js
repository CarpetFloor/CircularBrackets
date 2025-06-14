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

	function updateTime(created) {
		const mainChildren = document.querySelector(".main").children
		
		if(created) {
			if(mainChildren.length > 2) {
				mainChildren[mainChildren.length - 1].remove();
			}

			const p = document.createElement("p");
			p.className = "bracketCreatedNotice";
			p.innerText = "You have already created a bracket";

			document.querySelector(".main").appendChild(p);
		}
		else if(diff > 0) {
			if(mainChildren.length > 2) {
				mainChildren[mainChildren.length - 1].remove();
			}

			document.querySelector("#bracketDeadline").innerText = `You have ${daysDiff.toFixed(0)} days, ${hoursDiff.toFixed(0)} hours, and ${minutesDiff.toFixed(0)} minutes left to create a bracket!`;

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
		else {
			document.querySelector("#bracketDeadline").innerText = "Deadline to create bracket is over";
		}
	}

	socket.emit("check for bracket", localStorage.getItem("loggedIn"));

	socketListeners.push("bracket check result");
	socket.on("bracket check result", (created) => {
		updateTime(created);

		const interval = window.setInterval(() => {
			updateTime(created);
		}, 1000 * 30);

		intervals.push(interval);
	});
});

activeScripts.at(-1)();