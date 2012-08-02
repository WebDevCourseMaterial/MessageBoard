
/**
 * @fileoverview Controls the display of rose-message-baord messages.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */

goog.provide('messageboard.MessageBoardController');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');
goog.require('goog.debug.Logger');
goog.require('goog.soy');
goog.require('messageboard.templates.messageboard');


/**
 * Top level controller for the message board.
 *
 * @param {!Element} container The element for this controller's content.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
messageboard.MessageBoardController = function(container) {
  goog.base(this);
  
  /**
   * Container element for this controller's content.
   * @type {!Element}
   * @private
   */
  this.container_ = container;

  /**
   * Holds events that should only be removed when the controller is disposed.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler(this);
  
  this.init_();
  
};
goog.inherits(messageboard.MessageBoardController, goog.events.EventTarget);


/**
 * Logger for this class.
 * @type {goog.debug.Logger}
 */
messageboard.MessageBoardController.prototype.logger =
    goog.debug.Logger.getLogger('messageboard.MessageBoardController');


/**
 * Initialize the message board.
 * @private 
 */
messageboard.MessageBoardController.prototype.init_ = function() {
  
};


/** inheritDoc */
messageboard.MessageBoardController.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');

  // Remove listeners added.
  this.eventHandler_.removeAll();
  goog.dispose(this.eventHandler_);
  delete this.eventHandler_;
  
  // Remove the DOM elements.
  goog.dom.removeChildren(this.container_);
};
