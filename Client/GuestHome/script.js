activeScripts.push(() => {
	const popupButton = document.querySelector(".mainButton");
	const popup = document.querySelector("div.popup");

	let popupOpen = false;

	popupButton.addEventListener("click", () => {
		popupOpen = !(popupOpen);

		if(popupOpen) {
			popup.style.display = "flex";
		}
		else {
			popup.style.display = "none";
		}
	});

	let usernameEntered = null;

	const signupButton = document.querySelector("#signupButton");
	const signupInputs = document.querySelector(".signupInputs");
	const buttons = document.querySelector(".buttons");

	signupButton.addEventListener("click", () => {
		buttons.style.display = "none";
		loginInputs.style.display = "none";

		signupInputs.style.display = "flex";
	});

	const requestSignup = document.querySelector("#requestSignup");
	requestSignup.addEventListener("click", () => {
		usernameEntered = document.querySelector("#signupUsername").value;
		const passwordEntered = document.querySelector("#signupPassword").value;
		
		socket.emit("request signup", {
			username: usernameEntered, 
			password: passwordEntered
		});
	});

	socketListeners.push("signup failed");
	socket.on("signup failed", (reason) => {
		window.alert(`Signup failed: ${reason}`);
	});

	socketListeners.push("signup success");
	socket.on("signup success", () => {
		window.alert("Successfully created account!");

		localStorage.setItem("loggedIn", usernameEntered);
		loadPage("user home");
	});

	const loginButton = document.querySelector("#loginButton");
	const loginInputs = document.querySelector(".loginInputs");

	loginButton.addEventListener("click", () => {
		buttons.style.display = "none";
		signupInputs.style.display = "none";

		loginInputs.style.display = "flex";
	});

	const requestLogin = document.querySelector("#requestLogin");
	requestLogin.addEventListener("click", () => {
		usernameEntered = document.querySelector("#loginUsername").value;
		const passwordEntered = document.querySelector("#loginPassword").value;
		
		console.log("sending request");
		socket.emit("request login", {
			username: usernameEntered, 
			password: passwordEntered
		});
	});

	socketListeners.push("login failed");
	socket.on("login failed", (reason) => {
		window.alert(`Login failed: ${reason}`);
	});

	socketListeners.push("login success");
	socket.on("login success", () => {
		window.alert("Successfully logged into account!");

		localStorage.setItem("loggedIn", usernameEntered);
		loadPage("user home");
	});
});

activeScripts.at(-1)();