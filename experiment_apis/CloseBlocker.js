var { ExtensionSupport } = ChromeUtils.import("resource:///modules/ExtensionSupport.jsm");

var CloseBlocker = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      CloseBlocker: {
        install() {
          function closeListener(event) {
            const currentTarget = event.currentTarget;
            if (currentTarget.windowState.valueOf() != 2) {
              currentTarget.minimize();
              event.preventDefault(currentTarget.windowState.valueOf());
            }
          }

          function clickListener(event) {
            if (event.target.id == "titlebar-close") {
              closeListener(event);
            }
          }

          const extensionId = context.extension.id;
          const windowSet = new Set();

          // Listen for the main Thunderbird windows opening.
          ExtensionSupport.registerWindowListener(extensionId, {
            chromeURLs: [
              "chrome://messenger/content/messenger.xhtml",
              // Before Thunderbird 74, messenger.xhtml was messenger.xul.
              "chrome://messenger/content/messenger.xul"
            ],
            onLoadWindow(aWindow) {
              // Add listeners to the window.
              windowSet.add(aWindow);
              aWindow.addEventListener("close", closeListener, false);
              aWindow.addEventListener("click", clickListener, false);
            },
            onUnloadWindow(aWindow) {
              // This should not actually happen, but just in case ...
              console.log("Unexpected window unload event on window:", aWindow);
              windowSet.delete(aWindow);
            }
          });

          // Register an onClose cleanup callback.
          context.callOnClose({
            close() {
              // Stop listening for new windows.
              ExtensionSupport.unregisterWindowListener(extensionId);
              // Remove listeners from windows to which they were added.
              windowSet.forEach(function (aWindow) {
                aWindow.removeEventListener("close", closeListener, false);
                aWindow.removeEventListener("click", clickListener, false);
              });
              windowSet.clear();
            }
          });
        }
      }
    }
  }
};
