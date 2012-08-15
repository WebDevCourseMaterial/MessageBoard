
/**
 * @fileoverview Controls the authoring of rose-message-baord messages.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */

goog.provide('messageboard.MessagePostController');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');
goog.require('goog.json');
goog.require('goog.net.XhrIo');
goog.require('goog.net.CrossDomainRpc');
goog.require('goog.soy');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Css3ButtonRenderer');
goog.require('messageboard.OAuthIdentifier');
goog.require('messageboard.templates.messagepost');



/**
 * Controller used author messages sent to the rose-message-board.
 *
 * @param {Element} container The element for this controller's content.
 * @param {messageboard.OAuthIdentifier} oauthIdentifier The element for this controller's content.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
messageboard.MessagePostController = function(container, oauthIdentifier) {
  goog.base(this);
  
  /**
   * Container element for this controller's content.
   * @type {Element}
   * @private
   */
  this.container_ = container;

  /**
   * @type {goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = null;

  /**
   * @type {goog.ui.Control}
   * @private
   */
  this.authButtonControl_ = null;

  /**
   * 
   * @type {messageboard.OAuthIdentifier}
   * @private
   */
  this.oauthIdentifier_ = oauthIdentifier;
  
  /**
   * Google+ id of the end user.
   * @private 
   */
  this.gPlusId_ = '';
  
  /**
   * Holds events that should only be removed when the controller is disposed.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler(this);
  
  this.init_();
  
};
goog.inherits(messageboard.MessagePostController, goog.events.EventTarget);


/**
 * Events that can be fired by instances of this class.
 * @enum {string}
 */
messageboard.MessagePostController.EventType = {
  NEW_MESSAGE_POSTED: goog.events.getUniqueId('new-message')
};


/**
 * Logger for this class.
 * @type {goog.debug.Logger}
 */
messageboard.MessagePostController.prototype.logger =
    goog.debug.Logger.getLogger('messageboard.MessagePostController');


/**
 * Initialize the post controller.  Before adding UI elements check the OAuth
 * state.
 */
messageboard.MessagePostController.prototype.init_ = function() {
  // Add listeners to the oauthIdentifier then initialize it.
  this.eventHandler_.listen(this.oauthIdentifier_,
      messageboard.OAuthIdentifier.EventType.OAUTH_INCOMPLETE,
      this.hangleOAuthIdFailure_);
  this.eventHandler_.listen(this.oauthIdentifier_,
      messageboard.OAuthIdentifier.EventType.GOOGLE_PLUS_ID_ERROR,
      this.hangleOAuthIdFailure_);
  this.eventHandler_.listen(this.oauthIdentifier_,
      messageboard.OAuthIdentifier.EventType.GOOGLE_PLUS_ID_SUCCESS,
      this.hangleOAuthIdSuccess_);
  
  // CONSIDER: Create a timer that will fire if no events occur (ie a fallback).
  
  this.oauthIdentifier_.initialize();
  // For layout testing you can show one of the display UIs directly (cheating).
  //this.renderOAuthButton_();
  //this.renderPostOverly_('https://lh5.googleusercontent.com/-vB9HMliwbIY/' +
  //  'AAAAAAAAAAI/AAAAAAAAAAA/kVHRubd8QZM/photo.jpg?sz=50');
};


/**
 * Callback for the OAuth identifier that puts up a button on the screen to do
 * oauth via the popup window.
 *
 * @param {goog.events.Event} e Event from oauthIdentifier with an event type.
 */
messageboard.MessagePostController.prototype.hangleOAuthIdFailure_ =
    function(e) {
  this.logger.info('OAuth not complete.  Display the auth button. ' + 
      'Event type ' + e.type);
  this.renderOAuthButton_();
};


/**
 * Callback for the OAuth identifier that puts up a picture of the end user and
 * an input box for their message.
 *
 * @param {messageboard.OAuthIdentifier.GooglePlusIdSuccessEvent} e Event with
 *     the metadata about the end user.
 */
messageboard.MessagePostController.prototype.hangleOAuthIdSuccess_ =
    function(e) {
  this.gPlusId_ = e.gPlusId;
  this.renderPostOverly_(e.gPlusThumbnail);
};


/**
 * Renders the authentication button and adds a listener to the button.
 *
 * @private
 */
messageboard.MessagePostController.prototype.renderOAuthButton_ = function() {
  goog.soy.renderElement(this.container_,
      messageboard.templates.messagepost.postOverlayNotSignedIn);

  // Add a control to the one and only button.
  this.authButtonControl_ = new goog.ui.CustomButton('',
      goog.ui.Css3ButtonRenderer.getInstance());
  this.authButtonControl_.decorate(
      goog.dom.getElementByClass(goog.getCssName('auth-button')));
  this.eventHandler_.listen(this.authButtonControl_,
      goog.ui.Component.EventType.ACTION,
      function(e) {
        this.logger.warning('Clicked the auth button to launch popup.');
        this.oauthIdentifier_.authorizePopUp();
      });
};


/**
 * Renders the user thumbnail and input box.  Adds a listener to the input box
 * for the enter key.
 *
 * @param {string} userThumbnail Url of the end users Google+ thumbnail.
 * @private
 */
messageboard.MessagePostController.prototype.renderPostOverly_ =
    function(userThumbnail) {
  goog.soy.renderElement(this.container_,
      messageboard.templates.messagepost.postOverlay,
      {userThumbnail: userThumbnail});
  this.keyHandler_ = new goog.events.KeyHandler(
      goog.dom.getElement('post-input'));
  this.eventHandler_.listen(this.keyHandler_,
      goog.events.KeyHandler.EventType.KEY, this.onKeyEvent_);
};


/**
 * Listener for key press events.
 * @param {goog.events.KeyEvent} e Key event.
 * @private
 */
messageboard.MessagePostController.prototype.onKeyEvent_ = function(e) {
  switch (e.keyCode) {
    case goog.events.KeyCodes.ENTER:
      this.submitMessage_();
      break;
  }
};


/**
 * Submits the message to the backend.
 */
messageboard.MessagePostController.prototype.submitMessage_ = function() {
  this.logger.info('Submit the text in the box.');  
  var inputValue = goog.dom.getElement('post-input').value;
  var newMessage = {'google_plus_id': this.gPlusId_, 'comment': inputValue};
  goog.dom.getElement('post-input').value = '';
  var postBodyJson = goog.json.serialize(newMessage);
  goog.net.XhrIo.send(
      '/api',
      goog.bind(this.handleXhrResponse_, this),
      'POST',
      postBodyJson,
      {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.oauthIdentifier_.oauthToken
      });
};


/**
 * Processed the backend response to make sure there were no errors.  Fires
 * an event if the message was successfully added.
 *
 * @param {goog.events.BrowserEvent} e Event for XHR response.
 */
messageboard.MessagePostController.prototype.handleXhrResponse_ = function(e) {
  var xhr = /** @type {goog.net.XhrIo} */ (e.target);  
  if (!xhr.isSuccess()) {
    this.logger.warning('Xhr POST requested failed with status ' +
        xhr.getStatus());
    return;
  }
  var messageResponse = xhr.getResponseJson();
  if (messageResponse.hasOwnProperty('error')) {
    this.logger.warning('Error getting messageboard. ' +
        messageResponse['error']);
    return;
  }
  // Fire an event that a new message has been successfully added.
  this.dispatchEvent(
      messageboard.MessagePostController.EventType.NEW_MESSAGE_POSTED);
};


/** inheritDoc */
messageboard.MessagePostController.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');

  // Remove listeners added.
  this.eventHandler_.removeAll();
  goog.dispose(this.eventHandler_);
  delete this.eventHandler_;

  // Remove components that add listeners.
  goog.dispose(this.authButtonControl_);
  delete this.authButtonControl_;
  goog.dispose(this.keyHandler_);
  delete this.keyHandler_;
  
  // Remove the DOM elements.
  goog.dom.removeChildren(this.container_);
};
