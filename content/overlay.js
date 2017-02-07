window.addEventListener("close", function( event ) {
    if(window === window.top) {
        event.preventDefault();
        window.minimize();
    }
}, false);