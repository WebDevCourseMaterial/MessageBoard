
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
   * Holds events that should only be removed when the controller is disposed.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler(this);
  
  this.updateMessages();
  
};
goog.inherits(messageboard.MessageViewerController, goog.events.EventTarget);


/**
 * Message from the backend.  Note this typedef is for documentation.
 * @typedef {{
 *   'status': string,
 *   'messages': Array.<messageboard.Message>,
 *   'error': string}}
 */
messageboard.MessageResponse;


/**
 * Google API key generated from https://developers.google.com/console/
 * 
 *            CHANGE THIS TO YOUR OWN KEY!!!
 */
messageboard.MessageViewerController.API_KEY =
    'AIzaSyC4hhfmlBAmxe269S-_2xXr8fUKFAF7qrI';


/**
 * Logger for this class.
 * @type {goog.debug.Logger}
 */
messageboard.MessageViewerController.prototype.logger =
    goog.debug.Logger.getLogger('messageboard.MessageViewerController');


/**
 * Updates the messages displayed in the UI.  Starts the process by doing a new
 * request from the AppEngine server for messages.
 */
messageboard.MessageViewerController.prototype.updateMessages = function() {
  goog.net.XhrIo.send(
      'http://rose-message-board.appspot.com/api?limit=10', // Full path.
      //'/api?limit=10',
      goog.bind(this.handleMessagesResponse_, this));
};


/** @typedef
 * {{displayName: string,
 *   image: {url: string},
 *   error: {message: string}}}
 */
messageboard.GooglePlusApiResponse;


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
  this.renderUiForMessages_(messages);
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
    // TODO: Use a template to create a fragment then insert fragment.
  } else {
    goog.soy.renderElement(this.container_,
        messageboard.templates.messageviewer.messagesList, data);    
  }
  // Use the Google+ API to figure out the missing authors.
  goog.array.forEach(unknownIds, goog.bind(function(unknownId) {
    this.getGooglePlusId_(unknownId);
  }, this));
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
