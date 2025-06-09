let socket = io();

window.onload = () => {
	const popupButton = document.querySelector(".mainButton");
	const popup = document.querySelector("div.popup");

	let popupOpen = false;

	popupButton.addEventListener("click", () => {
		popupOpen = !(popupOpen);

		if(popupOpen) {
			popup.style.display = "block";
		}
		else {
			popup.style.display = "none";
		}
	});

	const signupButton = document.querySelector("#signupButton");
	const signupInputs = document.querySelector(".signupInputs");
	const buttons = document.querySelector(".buttons");

	signupButton.addEventListener("click", () => {
		buttons.style.display = "none";
		signupInputs.style.display = "flex";
	});

	const requestSignup = document.querySelector("#requestSignup");
	requestSignup.addEventListener("click", () => {
		const usernameEntered = document.querySelector("#signupUsername").value;
		const passwordEntered = document.querySelector("#signupPassword").value;
		
		socket.emit("request signup", {
			username: usernameEntered, 
			password: passwordEntered
		});
	});

	socket.on("signup failed", (reason) => {
		window.alert(`Signup failed: ${reason}`);
	});

	socket.on("signup success", (reason) => {
		window.alert("Successfully created account!");
	});
}