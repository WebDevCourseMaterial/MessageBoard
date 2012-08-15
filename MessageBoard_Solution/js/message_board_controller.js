
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
goog.require('messageboard.MessagePostController');
goog.require('messageboard.MessageViewerController');
goog.require('messageboard.OAuthIdentifier');
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
   * View controller for the display of messages.
   * @type {messageboard.MessageViewerController}
   * @private
   */
  this.messageViewController_ = null;
  
  /**
   * View controller for the creation of new messages.
   * @type {messageboard.MessagePostController}
   * @private
   */
  this.messagePostController_ = null;
  
  /**
   * Helper class used to determine the identity of the end user.
   * @type {messageboard.OAuthIdentifier}
   * @private
   */
  this.oauthIdentifier_ = null;

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
  // Note, modifications to the DOM are VERY slow.  It's better to build up the
  // nodes then append to the DOM all at once.  Not doing that correctly here
  // because some of the later code expects DOM elements to be present on the
  // page.  Ideally everything would find elements within the fragment instead.
  goog.soy.renderElement(this.container_,
      messageboard.templates.messageboard.main);
  
  this.messageViewController_ = new messageboard.MessageViewerController(
      goog.dom.getElement('message-viewer'));
  this.oauthIdentifier_ = new messageboard.OAuthIdentifier;
  this.messagePostController_ = new messageboard.MessagePostController(
      goog.dom.getElement('message-post'), this.oauthIdentifier_);
  
  this.eventHandler_.listen(this.messagePostController_,
      messageboard.MessagePostController.EventType.NEW_MESSAGE_POSTED,
      function(e) {
        this.messageViewController_.fetchMessages(0);
      });
};


/** inheritDoc */
messageboard.MessageBoardController.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');

  // Remove listeners added.
  this.eventHandler_.removeAll();
  goog.dispose(this.eventHandler_);
  delete this.eventHandler_;
  
  // Dispose of instance variables (view controllers and oauth helper).
  goog.dispose(this.messageViewController_);
  delete this.messageViewController_;
  goog.dispose(this.messagePostController_);
  delete this.messagePostController_;
  goog.dispose(this.oauthIdentifier_);
  delete this.oauthIdentifier_;
  
  // Remove the DOM elements.
  goog.dom.removeChildren(this.container_);
};
