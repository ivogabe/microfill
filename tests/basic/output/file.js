;(function(){
	var n = 0;

	if (!window.setImmediate) n += 1 << 0;
	if (!window.Promise) n += 1 << 1;
	if (!window.fetch) n += 1 << 2;
	if (!window.WeakMap || !window.Map || !window.Set) n += 1 << 3;
	
	var script = document.createElement("script");
	script.src = "file-" + n.toString(16) + ".js";
	script.type = "text/javascript";
	document.head.appendChild(script);
})();
