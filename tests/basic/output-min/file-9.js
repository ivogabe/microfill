(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var setImmediate;

    function addFromSetImmediateArguments(args) {
        tasksByHandle[nextHandle] = partiallyApplied.apply(undefined, args);
        return nextHandle++;
    }

    // This function accepts the same arguments as setImmediate, but
    // returns a function that requires no arguments.
    function partiallyApplied(handler) {
        var args = [].slice.call(arguments, 1);
        return function() {
            if (typeof handler === "function") {
                handler.apply(undefined, args);
            } else {
                (new Function("" + handler))();
            }
        };
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(partiallyApplied(runIfPresent, handle), 0);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    task();
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function installNextTickImplementation() {
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            process.nextTick(partiallyApplied(runIfPresent, handle));
            return handle;
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            global.postMessage(messagePrefix + handle, "*");
            return handle;
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            channel.port2.postMessage(handle);
            return handle;
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
            return handle;
        };
    }

    function installSetTimeoutImplementation() {
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            setTimeout(partiallyApplied(runIfPresent, handle), 0);
            return handle;
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(new Function("return this")()));
(function(e){function f(a,b){function c(a){if(!this||this.constructor!==c)return new c(a);this._keys=[];this._values=[];this.objectOnly=b;a&&u.call(this,a)}b||v(a,"size",{get:w});a.constructor=c;c.prototype=a;return c}function u(a){this.add?a.forEach(this.add,this):a.forEach(function(a){this.set(a[0],a[1])},this)}function g(a){this.has(a)&&(this._keys.splice(d,1),this._values.splice(d,1));return-1<d}function m(a){return this.has(a)?this._values[d]:void 0}function n(a,b){if(this.objectOnly&&b!==Object(b))throw new TypeError("Invalid value used as weak collection key");
if(b!=b||0===b)for(d=a.length;d--&&!x(a[d],b););else d=a.indexOf(b);return-1<d}function p(a){return n.call(this,this._values,a)}function q(a){return n.call(this,this._keys,a)}function r(a,b){this.has(a)?this._values[d]=b:this._values[this._keys.push(a)-1]=b;return this}function t(a){this.has(a)||this._values.push(a);return this}function h(){this._values.length=0}function y(){return k(this._keys)}function l(){return k(this._values)}function z(){return k(this._keys,this._values)}function A(){return k(this._values,
this._values)}function k(a,b){var c=0,d=!1;return{next:function(){var e;!d&&c<a.length?(e=b?[a[c],b[c]]:a[c],c+=1):d=!0;return{done:d,value:e}}}}function w(){return this._values.length}function B(a,b){var c=this,d=c._values.slice();c._keys.slice().forEach(function(e,f){a.call(b,d[f],e,c)})}function C(a,b){var c=this;c._values.slice().forEach(function(d){a.call(b,d,d,c)})}var d,v=Object.defineProperty,x=function(a,b){return isNaN(a)?isNaN(b):a===b};"undefined"==typeof WeakMap&&(e.WeakMap=f({"delete":g,
clear:h,get:m,has:q,set:r},!0));"undefined"==typeof Map&&(e.Map=f({"delete":g,has:q,get:m,set:r,keys:y,values:l,entries:z,forEach:B,clear:h}));"undefined"==typeof Set&&(e.Set=f({has:p,add:t,"delete":g,clear:h,keys:l,values:l,entries:A,forEach:C}));"undefined"==typeof WeakSet&&(e.WeakSet=f({"delete":g,add:t,clear:h,has:p},!0))})("undefined"!=typeof exports&&"undefined"!=typeof global?global:window);
/* file.js */
