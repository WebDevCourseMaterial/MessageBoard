
/**
 * @fileoverview Controls the display of rose-message-baord messages.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */

goog.provide('messageboard.MessageViewerController');
goog.provide('messageboard.MessageResponse');

goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');
goog.require('goog.debug.Logger');
goog.require('goog.json');
goog.require('goog.net.XhrIo');
goog.require('goog.soy');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Css3ButtonRenderer');
goog.require('messageboard.Message');
goog.require('messageboard.MessageViewerStorage');
goog.require('messageboard.templates.messageviewer');



/**
 * Populates a list with a rose-message-board response.
 *
 * @param {Element} container The element for this controller's content.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
messageboard.MessageViewerController = function(container) {
  goog.base(this);
  
  /**
   * Container element for this controller's content.
   * @type {Element}
   * @private
   */
  this.container_ = container;

  /**
   * Indicates the state of this class.
   * @type {messageboard.MessageViewerController.State}
   * @private
   */
  this.state_ = 
      messageboard.MessageViewerController.State.ALL_MESSAGES_RENDERED;
  
  /**
   * Indicates the offset that should be used for the next message request.
   * @type {number}
   * @private
   */
  this.nextMessageOffset_ = 0;

  /**
   * Holds events that should only be removed when the controller is disposed.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler(this);
  
  this.init_();
};
goog.inherits(messageboard.MessageViewerController, goog.events.EventTarget);


/**
 * Google API key generated from https://developers.google.com/console/
 * 
 * 
 *            CHANGE THIS TO YOUR OWN KEY!!!
 *
 * @type {string}
 */
messageboard.MessageViewerController.API_KEY =
    'AIzaSyC4hhfmlBAmxe269S-_2xXr8fUKFAF7qrI';


/**
 * When requesting messages from the backend request this many messages at a
 * time.  Note that the backend limits you to 20 messages at a time.
 * @type {number}
 */
messageboard.MessageViewerController.MESSAGE_LIMIT_SIZE = 10;


/**
 * Logger for this class.
 * @type {goog.debug.Logger}
 */
messageboard.MessageViewerController.prototype.logger =
    goog.debug.Logger.getLogger('messageboard.MessageViewerController');


/**
 * Initialize the message viewer controller.
 */
messageboard.MessageViewerController.prototype.init_ = function() {
  // Listen for scroll events so you can detect when the bottom is reached.
  this.eventHandler_.listen(window, 'scroll', function(e) {
    var scrolledLocation = window.pageYOffset + window.innerHeight;
    if (scrolledLocation >= (document.body.offsetHeight - 2)) {
      this.handleScrollToBottom_();
    }
  });
  this.fetchMessages(0);
};


/**
 * States that this class might be in.
 * @enum {string}
 */
messageboard.MessageViewerController.State = {
  LOADING_MESSAGES: 'loading-messages',
  ALL_MESSAGES_RENDERED: 'all-messages-rendered',
  NO_MORE_MESSAGES_TO_LOAD: 'no-more-messages-to-load'
};


/**
 * Starts the process of loading more messages when a user scrolls to the
 * bottom of the page.
 */
messageboard.MessageViewerController.prototype.handleScrollToBottom_ =
    function() {
  if (this.state_ ==
      messageboard.MessageViewerController.State.ALL_MESSAGES_RENDERED) {
    this.fetchMessages();
  }
};


/**
 * Updates the messages displayed in the UI.  Starts the process by doing a new
 * request from the AppEngine server for messages.
 *
 * @param {number=} offset Next offset to use.  If given sets that value.  If
 *     not given uses the instance variable. 
 */
messageboard.MessageViewerController.prototype.fetchMessages =
    function(offset) {
  if (this.state_ != 
      messageboard.MessageViewerController.State.ALL_MESSAGES_RENDERED) {
    this.logger.info('Call to fetchMessages ignored. State = ' + this.state_);
    return;
  }
  this.state_ = messageboard.MessageViewerController.State.LOADING_MESSAGES;
  if (goog.isNumber(offset)) {
    this.nextMessageOffset_ = offset;
  }
  var requestUri = new goog.Uri('/api');
  //var requestUri = new goog.Uri('http://rose-message-board.appspot.com/api');
  requestUri.setParameterValue('limit',
      messageboard.MessageViewerController.MESSAGE_LIMIT_SIZE);
  requestUri.setParameterValue('offset', this.nextMessageOffset_);
  goog.net.XhrIo.send(
      requestUri.toString(),
      goog.bind(this.handleMessagesResponse_, this));
};


/**
 * Message from the backend.  Note this typedef is for documentation.
 * @typedef {{
 *   'status': string,
 *   'messages': Array.<messageboard.Message>,
 *   'error': string}}
 */
messageboard.MessageResponse;


/**
 * Handles the JSON reply from AppEngine with the list of messages.
 * @param {goog.events.BrowserEvent} e Xhr event.
 * @private
 */
messageboard.MessageViewerController.prototype.handleMessagesResponse_ =
    function(e) {
  var xhr = /** @type {goog.net.XhrIo} */ (e.target);  
  if (!xhr.isSuccess()) {
    this.logger.warning('Xhr GET requested failed with status ' +
        xhr.getStatus());
    return;
  }
  var messageResponse = /** @type {messageboard.MessageResponse} */
      (xhr.getResponseJson());
  if (messageResponse.hasOwnProperty('error')) {
    this.logger.warning('Error getting messageboard. ' +
        messageResponse['error']);
    return;
  }
  var messages = messageResponse['messages'];
  if (messages.length > 0) {
    this.renderUiForMessages_(messages, this.nextMessageOffset_ != 0);
    this.nextMessageOffset_ +=
      messageboard.MessageViewerController.MESSAGE_LIMIT_SIZE;    
  } else {
    // Assume that the lack of messages means there are no more.
    this.state_ =
      messageboard.MessageViewerController.State.NO_MORE_MESSAGES_TO_LOAD;
  }
};


/**
 * Handles the JSON reply from AppEngine with the list of messages.
 *
 * @param {Array.<messageboard.Message>} messages  Array of messages from the
 *     AppEngine backend.
 * @param {boolean=} append If true add these messages onto the end of the
 *     messages already being displayed.  If false clear any messages being
 *     displayed and replace the contents with these new offset=0 messages.
 * @private
 */
messageboard.MessageViewerController.prototype.renderUiForMessages_ =
    function(messages, append) {
  var storage = messageboard.MessageViewerStorage.getInstance();
  var unknownIds = storage.addKnownAuthorMetadata(messages);
  var data = {messages: messages};
  if (append) {
    var messagesFrag = goog.soy.renderAsFragment(
        messageboard.templates.messageviewer.messages, data);
    goog.dom.appendChild(goog.dom.getElement('message-list'), messagesFrag);
  } else {
    window.scroll(0, 0);
    goog.soy.renderElement(this.container_,
        messageboard.templates.messageviewer.messagesList, data);
  }
  // Use the Google+ API to figure out the missing authors.
  goog.array.forEach(unknownIds, goog.bind(function(unknownId) {
    this.getGooglePlusId_(unknownId);
  }, this));
  this.state_ = 
    messageboard.MessageViewerController.State.ALL_MESSAGES_RENDERED;
};


/**
 * Get the name and thumbnail for the Google+ id.  Add the response to the page
 * and to localStorage.
 *
 * @param {string} gPlusId Google+ id to retrieve from local storage.
 * @private
 */
messageboard.MessageViewerController.prototype.getGooglePlusId_ =
    function(gPlusId) {
  var requestPath = 'https://www.googleapis.com/plus/v1/people/' + gPlusId;
  var requestUri = new goog.Uri(requestPath);
  requestUri.setParameterValue('fields', 'displayName,image');
  requestUri.setParameterValue('key',
      messageboard.MessageViewerController.API_KEY);
  this.logger.info('Making request for ' + requestUri.toString());
  this.logger.info('Desired request is ' + 'https://www.googleapis.com/plus/v1/people/106027280718489289045?fields=displayName%2Cimage&key=' + messageboard.MessageViewerController.API_KEY);
  goog.net.XhrIo.send(
      requestUri.toString(),
      goog.bind(this.handleGooglePlusApiResponse_, this, gPlusId));
};


/** 
 * Mainly just a reference for the response format. Not required.
 * @typedef {{
 *   'displayName': string,
 *   'image': {'url': string},
 *   'error': {'message': string}}}
 */
messageboard.GooglePlusApiResponse;


/**
 * Add the response to the page and to local storage.
 * @param {goog.events.BrowserEvent} e Xhr event.
 * @private
 */
messageboard.MessageViewerController.prototype.handleGooglePlusApiResponse_ =
    function(gPlusId, e) {
  var xhr = /** @type {goog.net.XhrIo} */ (e.target);
  if (!xhr.isSuccess()) {
    this.logger.warning("Google+ Api requested failed with status " +
        xhr.getStatus());
    return;
  }
  var messageResponse = xhr.getResponseJson();
  if (messageResponse.hasOwnProperty('error')) {
    this.logger.warning('Error getting Google+ API. ' +
          messageResponse['error']['message']);
    return;
  }
  var displayName = messageResponse['displayName'];
  var imageUrl =  messageResponse['image']['url'];
  // Change the requested image size to 80 instead of 50.
  var imageUri = new goog.Uri(imageUrl);
  imageUri.setParameterValue('sz', '80');

  // Add the Google+ info to all the author notes on the page.
  var imgs = goog.dom.getDocument().querySelectorAll('.gp-' + gPlusId + ' img');
  goog.array.forEach(imgs, function(imgEl) {
    imgEl.src = imageUri.toString();
  });
  var names = goog.dom.getDocument().querySelectorAll('.gp-' + gPlusId + ' h4');
  goog.array.forEach(names, function(nameEl) {
    nameEl.innerHTML = displayName; // Think about XSS risks.
  });
  var storage = messageboard.MessageViewerStorage.getInstance();
  storage.storeGooglePlusInfo(gPlusId, displayName, imageUrl);
};



/** inheritDoc */
messageboard.MessageViewerController.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');

  // Remove listeners added.
  this.eventHandler_.removeAll();
  goog.dispose(this.eventHandler_);
  delete this.eventHandler_;
  
  // Remove the DOM elements.
  goog.dom.removeChildren(this.container_);
};
