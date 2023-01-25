if (typeof chrome != "undefined") {
	var browser = chrome;
}

browser.tabs.query({active: true})
	.then(tabs => {
		document.querySelector("#prefill-button").addEventListener("click", function() {
			browser.scripting.executeScript({
				files: ["/inject.js"],
				target: {
					tabId: tabs[0].id,
				}
			})
		})
	});
