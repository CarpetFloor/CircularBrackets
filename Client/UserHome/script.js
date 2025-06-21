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
			document.querySelector("#createBracketContainer").innerHTML = "";

			const p = document.createElement("p");
			p.className = "bracketCreatedNotice";
			p.innerText = "You have already created a bracket";

			document.querySelector("#createBracketContainer").appendChild(p);

			document.querySelector("#createBracketContainer").innerHTML += `<button id="viewMyBracketButton">View My Bracket</button>`;
			document.querySelector("#viewMyBracketButton").addEventListener("click", () => {
				socket.emit(
					"request bracket user data", 
					localStorage.getItem("loggedIn")
				);
			});
		}
		else if(diff > 0) {
			document.querySelector("#createBracketContainer").innerHTML = "";

			document.querySelector("#bracketDeadline").innerText = `You have ${daysDiff.toFixed(0)} days, ${hoursDiff.toFixed(0)} hours, and ${minutesDiff.toFixed(0)} minutes left to create a bracket!`;

			const button = document.createElement("button");
			button.id = "createBracketButton";
			button.innerText = "Create Bracket";

			document.querySelector("#createBracketContainer").appendChild(button);

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

	socket.emit("request leaderboard");

	socketListeners.push("send leaderboard");
	socket.on("send leaderboard", (leaderboard) => {
		for(let user of leaderboard) {
			const div = document.createElement("div");

			const username = document.createElement("p");
			username.className = "username";
			username.innerText = user.username;
			div.appendChild(username);

			const points = document.createElement("p");
			points.className = "points";
			points.innerText = user.points;
			div.appendChild(points);

			document.querySelector(".leaderboard").appendChild(div);

			div.addEventListener("click", () => {
				socket.emit(
					"request bracket user data", 
					username.textContent
				);
			});
		}

		document.querySelector("#closeBracketViewButton").addEventListener("click", () => {
			document.querySelector(".bracketView").style.display = "none";
		});

		socketListeners.push("send bracket user data");
		socket.on("send bracket user data", (bracketData) => {
			let roundIndex = 0;
			for(
				const [roundKey, roundValue] of 
				Object.entries(bracketData)
			) {
				const roundElem = document.querySelectorAll(".round")[roundIndex];

				let gameIndex = 0;
				for(
					const [gameKey, gameValue] of 
					Object.entries(roundValue)
				) {
					for(let game of roundElem.querySelectorAll(".game")) {

						const nameCheck = game.querySelector(".title").textContent;

						if(nameCheck == gameValue.name) {
							const teamElems = game.querySelectorAll(".name");

							let predictionIndex = 0;
							let overIndex = 1;

							if(!(gameValue.predictionIsTop)) {
								predictionIndex = 1;
								overIndex = 0;
							}

							teamElems[predictionIndex].textContent = gameValue.prediction;
							teamElems[overIndex].textContent = gameValue.over;

							// correct value is null when initialized, indicating that game hasn't happened
							if(gameValue.correct === true) {
								teamElems[predictionIndex].parentElement.parentElement.classList.add("correct");
							}
							else if(gameValue.correct === false) {
								teamElems[predictionIndex].parentElement.parentElement.classList.add("incorrect");
							}

							teamElems[overIndex].parentElement.parentElement.className = "teamContainer";

							break;
						}
					}


					++gameIndex;
				}

				++roundIndex;
			}

			document.querySelector(".bracketView").style.display = "flex";
		});

		let marginLeft = 0;
		let round = 0;
		const maxRound = 3;

		const firstRoundContainer = document.querySelector("#firstRound");

		function updateTitle() {
			document.querySelector("#roundTitle").innerText = `Round ${(round + 1)}`
		}

		function previousRound() {
			for(let button of document.querySelector(".navControls").querySelectorAll("button")) {
				button.style.opacity = "1";
				button.style.pointerEvents = "auto";
			}

			if(round > 0) {
				marginLeft += 95;
				firstRoundContainer.style.marginLeft = `${marginLeft}vw`;

				--round;

				updateTitle();

				if(round == 0) {
					document.querySelector("#navBackButton").style.opacity = "0";
					document.querySelector("#navBackButton").style.pointerEvents = "none";
				}
			}
		}

		function nextRound() {
			for(let button of document.querySelector(".navControls").querySelectorAll("button")) {
				button.style.opacity = "1";
				button.style.pointerEvents = "auto";
			}

			if(round < maxRound) {
				marginLeft -= 95;
				firstRoundContainer.style.marginLeft = `${marginLeft}vw`;

				++round;

				updateTitle();

				if(round == maxRound) {
					document.querySelector("#navForwardButton").style.opacity = "0";
					document.querySelector("#navForwardButton").style.pointerEvents = "none";
				}
			}
		}

		document.querySelector("#navBackButton").addEventListener(
			"click", 
			() => {
				previousRound();
			}
		);

		document.querySelector("#navForwardButton").addEventListener(
			"click", 
			() => {
				nextRound();
			}
		);
	});
});

activeScripts.at(-1)();