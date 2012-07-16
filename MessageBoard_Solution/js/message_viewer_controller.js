
/**
 * @fileoverview Controls the display of rose-message-baord messages.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */

goog.provide('messages.MessageViewerController');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');
goog.require('goog.debug.Logger');
goog.require('goog.soy');



/**
 * Populates a list with messages.
 *
 * @param {!Element} contentElement The element for this controller's content.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
messages.MessageViewerController = function(contentElement) {
  goog.base(this);
  
  /**
   * Container element for this controller's content.
   * @type {!Element}
   * @private
   */
  this.container_ = contentElement;

  /**
   * Holds events that should only be removed when the controller is disposed.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler(this);
  
  this.init_();
  
};
goog.inherits(messages.MessageViewerController, goog.events.EventTarget);


/**
 * Logger for this class.
 * @type {goog.debug.Logger}
 */
messages.MessageViewerController.prototype.logger =
    goog.debug.Logger.getLogger('messages.MessageViewerController');



/**
 * Initialize the view controller.
 * @private
 */
messages.MessageViewerController.prototype.init_ = function() {
  
  // TODO:  Make an XHR to get a quote.
  
  var quotes = goog.dom.getElementsByTagNameAndClass('blockquote');
  this.logger.info('Number of quotes = ' + quotes.length);
  for (var i = 0; i < quotes.length; i++) {
    quotes[i].innerHTML = 'hi';
  }
};

