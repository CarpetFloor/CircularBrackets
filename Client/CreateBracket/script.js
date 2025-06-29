activeScripts.push(() => {
	const updateMap = new Map();

	socket.emit("get matchups");

	socketListeners.push("send matchups");
	socket.on("send matchups", (matchups) => {
		if(matchups === null) {
			window.alert("Server error getting data");
			return;
		}

		function setupBracket() {
			const matchupsToEnterTeams = [
				matchups.round1, 
				matchups.round2
			];
			const teamsCount = [
				2, 
				1
			];
			for(let m of matchupsToEnterTeams) {
				for(let game of m) {
					const parent = document.querySelectorAll(".round")[matchupsToEnterTeams.indexOf(m)];
					let gameElemIndex = -1;
					
					let index = 0;
					for(let gameElem of parent.children) {
						const title = gameElem.querySelector(".title");

						if(title.textContent == game.name) {
							gameElemIndex = index;
							break;
						}

						++index;
					}

					if(gameElemIndex == -1) {
						break;
					}

					if(teamsCount[matchupsToEnterTeams.indexOf(m)] >= 1) {
						parent.children[gameElemIndex].querySelectorAll("label")[0].innerText = game.team1;

					}

					if(teamsCount[matchupsToEnterTeams.indexOf(m)] >= 2) {
						parent.children[gameElemIndex].querySelectorAll("label")[1].innerText = game.team2;

					}
				}
			}

			document.querySelector(".bracket").style.display = "flex";
		}

		setupBracket();

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
				document.querySelector(".bracket").scrollTop = 0;
			}
		);

		document.querySelector("#navForwardButton").addEventListener(
			"click", 
			() => {
				nextRound();
				document.querySelector(".bracket").scrollTop = 0;
			}
		);

		let finishedBracket = false;

		/**
		 * input
		 * input index
		 * round
		 * round index
		 * game
		 * game index
		 */
		function handleInputClick(values) {
			const input = values.input;
			const inputIndex = values.inputIndex;
			const round = values.round;
			const roundIndex = values.roundIndex;
			const game = values.game;
			const gameIndex = values.gameIndex;

			const teamName = input.nextElementSibling.textContent;

			let nextRound = null;
			let nextGame = null;
			let teamLabel = null;

			switch(roundIndex) {
				case 0:
					nextRound = round.parentElement.parentElement.children[roundIndex + 1];
					nextGame = nextRound.children[0].children[gameIndex];

					teamLabel = nextGame.children[2].children[1];
					teamLabel.innerText = teamName;

					break;

				case 1:
				case 2:
					nextRound = round.parentElement.parentElement.children[roundIndex + 1];
					nextGame = nextRound.children[0].children[
						Math.floor(gameIndex / 2)];

					teamLabel = nextGame.children[(gameIndex % 2) + 1].children[1];
					teamLabel.innerText = teamName;

					break;
			}

			const allInputs = document.querySelectorAll("input");
			let totalInputs = 0;
			let selectedInputs = 0;

			for(let i of allInputs) {
				++totalInputs;

				if(i.checked) {
					++selectedInputs;
				}
			}

			if(
				(selectedInputs == (totalInputs / 2)) && 
				!(finishedBracket)
			) {
				finishedBracket = true;

				const button = document.createElement("button");
				button.id = "submitBracketButton";
				button.className = "simpleButtonHover";
				button.innerText = "Submit";

				document.querySelector("#lastRound").appendChild(button);

				button.addEventListener("click", () => {
					const bracketData = {};

					const rounds = document.querySelectorAll(".round");

					let roundIndex = 0;
					for(let round of rounds) {
						const games = round.querySelectorAll(".game");

						const roundData = [];
						
						for(let game of games) {
							const inputs = game.querySelectorAll("input");

							let teamSelected = null;
							let otherTeam = null;
							let gameName = null;
							let predictionFirst = inputs[0].checked;

							for(let input of inputs) {
								if(input.checked) {
									teamSelected = input.nextElementSibling.textContent;
									gameName = game.children[0].textContent;
								}
								else {
									otherTeam = input.nextElementSibling.textContent;
								}
							}

							switch(gameName) {
								case "Game 1":
									gameName = "Championship Weekend Game 1";
									break;

								case "Game 2":
									gameName = "Championship Weekend Game 2";
									break;

								case "Finals":
									gameName = "Championship Finals";
									break;
							}

							roundData.push(
								{
									name: gameName, 
									prediction: teamSelected, 
									over: otherTeam, 
									predictionIsTop: predictionFirst, 
									correct: null
								}
							);
						}

						const roundName = `round${roundIndex + 1}`;

						Object.defineProperty(
							bracketData, 
							roundName, 
							{
								value: roundData, 
								writeable: false, 
								enumerable: true, 
								configurable: false
							}
						);

						++roundIndex;
					}

					document.querySelector(".bracket").style.pointerEvents = "none";

					document.querySelector("#submitBracketButton").innerText = "Submitted";

					socket.emit(
						"send bracket", 
						{
							username: localStorage.getItem("loggedIn"), 
							bracket: bracketData
						}
					);

					socketListeners.push("bracket creation failed");
					socket.on("bracket creation failed", () => {
						window.alert("server failed to create bracket");
					});
				});
			}
		}

		function addMatchupListeners() {
			const rounds = document.querySelectorAll(".round");
			
			let roundIndex = 0;
			for(let round of rounds) {
				const games = round.querySelectorAll(".game");
				
				let gameIndex = 0;
				for(let game of games) {
					const inputs = game.querySelectorAll("input");

					let inputIndex = 0;
					for(let input of inputs) {
						const values = {
							input: input, 
							inputIndex: inputIndex, 
							round: round, 
							roundIndex: roundIndex, 
							game: game, 
							gameIndex: gameIndex
						};

						input.addEventListener("click", () => {
							handleInputClick(values);
						});

						++inputIndex;
					}

					++gameIndex;
				}

				++roundIndex;
			}
		}

		addMatchupListeners();
	});

	document.querySelector("#goBackButton").addEventListener(
		"click", 
		() => {
			window.location.reload();
		}
	);
});

activeScripts.at(-1)();