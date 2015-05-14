;(function(){
	var n = 0;

	
	var script = document.createElement("script");
	script.src = "file-" + n.toString(16) + ".js";
	script.type = "text/javascript";
	document.head.appendChild(script);
})();
