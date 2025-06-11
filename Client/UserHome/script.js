activeScripts.push(() => {
	document.querySelector("#usernameDisplay").innerText += 
		" " + 
		localStorage.getItem("loggedIn")
	;

	document.querySelector("#logoutButton").addEventListener("click", () => {
		localStorage.setItem("loggedIn", null);
		loadPage("guest home");
	})
});

activeScripts.at(-1)();