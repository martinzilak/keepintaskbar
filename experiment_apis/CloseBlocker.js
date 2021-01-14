var { ExtensionSupport } = ChromeUtils.import("resource:///modules/ExtensionSupport.jsm");

var CloseBlocker = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      CloseBlocker: {
        install() {
          const windowSet = new Set();

          function closeListener(event) {
            const currentTarget = event.currentTarget;
            // Block the event's default action unless the main window is already
            // minimized or there are multiple main windows.
            if (currentTarget.windowState.valueOf() != 2 && windowSet.size == 1) {
              currentTarget.minimize();
              event.preventDefault();
            }
          }

          function clickListener(event) {
            if (event.target.id == "titlebar-close") {
              closeListener(event);
            }
          }

          const extensionId = context.extension.id;

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
