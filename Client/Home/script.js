activeScripts.push(() => {
	const loggedInCheck = localStorage.getItem("loggedIn");
	if(loggedInCheck !== null) {
		document.querySelector("#accountHamburger").style.display = "none";
		document.querySelector("#logoutButton").style.display = "flex";

		document.querySelector("#welcomeMessage").style.display = "flex";
		document.querySelector("#welcomeMessage").innerText += ` ${loggedInCheck}`;

		document.querySelector("#logoutButton").addEventListener(
			"click", 
			() => {
				localStorage.removeItem("loggedIn");
				window.location.reload();
			}
		);

		document.querySelector("#loginNoticeContainer").innerHTML = `<button id="createBracketButton" class="simpleButtonHover">Create Bracket</button>`;
		document.querySelector("#createBracketButton").addEventListener(
			"click", 
			() => {
				loadPage("create bracket");
			}
		);

		socket.emit("request bracket exist check", loggedInCheck);

		socketListeners.push("send bracket exists");
		socket.on(
			"send bracket exists", 
			() => {
				document.querySelector("#loginNoticeContainer").innerHTML = `<p>You have already created a bracket</p>`;
				document.querySelector("#bracketDeadline").style.display = "none";
			}
		);

		document.title += " - Logged In";
	}

	const colors = {
		error: "#f06292"
	};

	const popupButton = document.querySelector(".mainButton");
	const popup = document.querySelector("div.popup");

	let popupOpen = false;

	popupButton.addEventListener("click", () => {
		popupOpen = !(popupOpen);

		if(popupOpen) {
			popup.style.display = "flex";

			document.querySelector("#hamburgerOpen").style.display = "none";
			document.querySelector("#hamburgerClose").style.display = "flex";
		}
		else {
			popup.style.display = "none";

			document.querySelector("#hamburgerOpen").style.display = "flex";
			document.querySelector("#hamburgerClose").style.display = "none";

			let inputs = signupInputs.querySelectorAll("input");
			
			for(let input of inputs) {
				input.style.borderColor = "transparent";
			}

			inputs = loginInputs.querySelectorAll("input");
			
			for(let input of inputs) {
				input.style.borderColor = "transparent";
			}
			
			document.querySelector("#errorMessage").className = "";
		}
	});

	let usernameEntered = null;

	const signupButton = document.querySelector("#signupButton");
	const signupInputs = document.querySelector(".signupInputs");
	const buttons = document.querySelector(".buttons");

	const closeHeaderPopupButtons = document.querySelectorAll(".closeHeaderPopup");
	for(let b of closeHeaderPopupButtons) {
		b.addEventListener("click", () => {
			loginInputs.style.display = "none";
			signupInputs.style.display = "none";

			buttons.style.display = "flex";

			document.querySelector(".popup").style.height = "4em";

			let inputs = signupInputs.querySelectorAll("input");
			
			for(let input of inputs) {
				input.style.borderColor = "transparent";
			}

			inputs = loginInputs.querySelectorAll("input");
			
			for(let input of inputs) {
				input.style.borderColor = "transparent";
			}
			
			document.querySelector("#errorMessage").className = "";
		});
	}

	signupButton.addEventListener("click", () => {
		buttons.style.display = "none";
		loginInputs.style.display = "none";

		signupInputs.style.display = "flex";

		document.querySelector(".popup").style.height = "12em";
	});

	const requestSignup = document.querySelector("#requestSignup");
	requestSignup.addEventListener("click", () => {
		const inputs = signupInputs.querySelectorAll("input");
		
		for(let input of inputs) {
			input.style.borderColor = "transparent";
		}

		usernameEntered = document.querySelector("#signupUsername").value;
		const passwordEntered = document.querySelector("#signupPassword").value;
		
		document.querySelector("#errorMessage").className = "";
		
		socket.emit("request signup", {
			username: usernameEntered, 
			password: passwordEntered
		});
	});

	socketListeners.push("signup failed");
	socket.on("signup failed", (reason) => {
		window.setTimeout(() => {
			const inputs = signupInputs.querySelectorAll("input");

			for(let input of inputs) {
				input.style.borderColor = colors.error;
			}

			document.querySelector("#errorMessage").innerText = reason;
			document.querySelector("#errorMessage").className = "animate";
		}, 200);
	});

	socketListeners.push("signup success");
	socket.on("signup success", () => {
		localStorage.setItem("loggedIn", usernameEntered);
		
		window.location.reload();
	});

	const loginButton = document.querySelector("#loginButton");
	const loginInputs = document.querySelector(".loginInputs");

	loginButton.addEventListener("click", () => {
		buttons.style.display = "none";
		signupInputs.style.display = "none";

		loginInputs.style.display = "flex";

		document.querySelector(".popup").style.height = "12em";
	});

	const requestLogin = document.querySelector("#requestLogin");
	requestLogin.addEventListener("click", () => {
		const inputs = loginInputs.querySelectorAll("input");
		
		for(let input of inputs) {
			input.style.borderColor = "transparent";
		}

		usernameEntered = document.querySelector("#loginUsername").value;
		const passwordEntered = document.querySelector("#loginPassword").value;
		
		document.querySelector("#errorMessage").className = "";

		socket.emit("request login", {
			username: usernameEntered, 
			password: passwordEntered
		});
	});

	socketListeners.push("login failed");
	socket.on("login failed", (reason) => {
		window.setTimeout(() => {
			const inputs = loginInputs.querySelectorAll("input");

			for(let input of inputs) {
				input.style.borderColor = colors.error;
			}

			document.querySelector("#errorMessage").innerText = reason;
			document.querySelector("#errorMessage").className = "animate";
		}, 200);
	});

	socketListeners.push("login success");
	socket.on("login success", () => {
		localStorage.setItem("loggedIn", usernameEntered);
		
		window.location.reload();
	});

	let reachedDeadline = false;

	function updateTime() {
		if(diff > 0) {
			const parent = document.querySelector("#bracketDeadline");
			const children = parent.children[1].children;

			const daysElem = children[0].children[0];
			daysElem.innerText = daysDiff.toFixed(0);

			const hoursElem = children[1].children[0];
			hoursElem.innerText = hoursDiff.toFixed(0);

			const minutesElem = children[2].children[0];
			minutesElem.innerText = minutesDiff.toFixed(0);
		}
		else if(!(reachedDeadline)){
			window.setTimeout(() => {
				reachedDeadline = true;
				const container = document.querySelector("#bracketDeadline");
				container.querySelector(".timeSections").style.display = "none";
				container.style.boxShadow = "none";

				const heading = container.querySelector(".heading");
				heading.innerText = "Deadline to create bracket is over";
				heading.style.fontWeight = "bold";

				const noticeContainer = document.querySelector("#loginNoticeContainer");
				const createBracketButton = noticeContainer.querySelector("button");
				if(createBracketButton !== null) {
					noticeContainer.style.display = "none";
				}
			}, 250);
		}
	}

	updateTime();
	const timeInterval = window.setInterval(() => {
		updateTime();
	}, 1000 * 30);
	intervals.push(timeInterval);

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

			const currentPoints = user.points;

			document.querySelector(".leaderboard").appendChild(div);

			div.addEventListener("click", () => {
				socket.emit(
					"request bracket user data", 
					username.textContent
				);

				document.querySelector("#points").innerText = `${currentPoints} points`;
				document.querySelector("p.username").innerText = `${username.textContent}'s Bracket`;
				while(round > 0) {
					previousRound();
				}
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

						let nameCheck = game.querySelector(".title").textContent;

						switch(nameCheck) {
							case "Game 1":
								nameCheck = "Championship Weekend Game 1";
								break;

							case "Game 2":
								nameCheck = "Championship Weekend Game 2";
								break;

							case "Finals":
								nameCheck = "Championship Finals";
								break;
						}

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
								teamElems[predictionIndex].parentElement.parentElement.style.zIndex = 1;
							}
							else if(gameValue.correct === false) {
								teamElems[predictionIndex].parentElement.parentElement.classList.add("incorrect");
								teamElems[predictionIndex].parentElement.parentElement.style.zIndex = 1;

								teamElems[predictionIndex].parentElement.parentElement.children[0].children[0].textContent = "x";
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

		let round = 0;
		const maxRound = 3;

		const firstRoundContainer = document.querySelector("#firstRound");

		function updateTitle() {
			switch(round) {
				case 0:
				case 1:
					document.querySelector("#roundTitle").innerText = `Round ${(round + 1)}`;
					break;
				
				case 2:
					document.querySelector("#roundTitle").innerText = `Champ. Weekend`;
					break;
				
				case 3:
					document.querySelector("#roundTitle").innerText = `Champ. Finals`;
					break;
			}
		}

		function previousRound() {
			for(let button of document.querySelector(".navControls").querySelectorAll("button")) {
				button.style.opacity = "1";
				button.style.pointerEvents = "auto";
			}

			if(round > 0) {
				--round;
				firstRoundContainer.className = "roundContainer";
				firstRoundContainer.classList.add(`scrollPage${round}`);
				document.querySelector(".bracket").scrollTop = 0;

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
				++round;
				firstRoundContainer.className = "roundContainer";
				firstRoundContainer.classList.add(`scrollPage${round}`);
				document.querySelector(".bracket").scrollTop = 0;


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
