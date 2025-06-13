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

	document.querySelector("#createBracketButton").addEventListener(
		"click", 
		() => {
			loadPage("create bracket");
		}
	);
});

activeScripts.at(-1)();