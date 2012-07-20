
/**
 * @fileoverview Simple main method.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */

goog.provide('messageboard.Main');

goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');
goog.require('goog.debug.LogManager');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('messageboard.MessageViewerController');

messageboard.Main = function() {
  goog.debug.LogManager.getRoot().setLevel(goog.debug.Logger.Level.INFO);
  var logconsole = new goog.debug.Console();
  logconsole.setCapturing(true);

  new messageboard.MessageViewerController(/** @type {!Element} */
      (goog.dom.getElement('message-viewer')));  
};


/**
 * Logger for this class.
 * @type {goog.debug.Logger}
 */
messageboard.Main.prototype.logger =
    goog.debug.Logger.getLogger('messageboard.Main');


/**
 * Entry point for JavaScript code.
 */
goog.events.listen(goog.dom.getDocument(), "DOMContentLoaded", function(e) {
  new messageboard.Main();
});