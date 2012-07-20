
/**
 * @fileoverview Controls the display of rose-message-baord messages.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */

goog.provide('messageboard.MessageViewerController');

goog.require('goog.Uri');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');
goog.require('goog.debug.Logger');
goog.require('goog.json');
goog.require('goog.net.XhrIo');
goog.require('goog.soy');
goog.require('messageboard.templates.messageviewer');



/**
 * Populates a list with a rose-message-board response.
 *
 * @param {!Element} container The element for this controller's content.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
messageboard.MessageViewerController = function(container) {
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
goog.inherits(messageboard.MessageViewerController, goog.events.EventTarget);


/**
 * API generated from https://code.google.com/apis/console
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
 * Display name when no author name is found.
 * @type {string}
 */
messageboard.MessageViewerController.UNKNOWN_NAME = 'Unknown';


/**
 * Link to the image that should be used if no image is found for author.
 * @type {string}
 */
messageboard.MessageViewerController.UNKNOWN_PHOTO =
    'images/no_photo_gitcat.png';


/**
 * Colors used by the author post-it notes.
 * @type {Array.<string>} 
 */
messageboard.MessageViewerController.AUTHOR_COLORS = [
    'green-darker-top',
    'yellow-darker-top',
    'teal-darker-top',
    'magenta-darker-top',
    'orange-darker-top'];


/**
 * Colors used by the comment post-it notes.
 * @type {Array.<string>} 
 */
messageboard.MessageViewerController.COMMENT_COLORS = [
    'green-darker-bottom',
    'yellow-darker-bottom',
    'teal-darker-bottom',
    'magenta-darker-bottom',
    'orange-darker-bottom'];


/**
 * Angles used by the author post-it notes.
 * @type {Array.<string>} 
 */
messageboard.MessageViewerController.AUTHOR_ANGLES = [
    'author-ccw-5',
    'author-ccw-2',
    'author-cw-2',
    'author-cw-5'];


/**
 * Angles used by the comment post-it notes.
 * @type {Array.<string>} 
 */
messageboard.MessageViewerController.COMMENT_ANGLES = [
    'comment-ccw-1_5',
    'comment-ccw-0_5',
    'comment-cw-0_5',
    'comment-cw-1_5'];


/**
 * Initialize the message view controller.
 * @private
 */
messageboard.MessageViewerController.prototype.init_ = function() {
  goog.net.XhrIo.send(
      'http://rose-message-board.appspot.com?limit=12',
      goog.bind(this.handleMessagesResponse_, this));
};


/** @typedef
 * {{comment: string,
 *   created_date_time: string,
 *   message_id: number,
 *   google_plus_id: string}}
 */
messageboard.Message;


/** @typedef
 * {{status: string,
 *   messages: Array.<messageboard.Message>,
 *   error: string}}
 */
messageboard.MessageResponse;


/** @typedef
 * {{displayName: string,
 *   image: {url: string},
 *   error: {message: string}}}
 */
messageboard.GooglePlusApiResponse;


/**
 * Handles the JSON reply from AppEngine with the list of messages.
 * @param {goog.events.BrowswerEvent} e Xhr event.
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
  var messageResponse = xhr.getResponseJson();
  if (messageResponse.hasOwnProperty('error')) {
    this.logger.warning('Error getting messageboard. ' +
        messageResponse['error']);
    return;
  }
  this.renderUiForMessageResponse_(messageResponse);
};
  
/**
 * Handles the JSON reply from AppEngine with the list of messages.
 * @param {messageboard.MessageResponse} messageResponse AppEngine response.
 * @private
 */
messageboard.MessageViewerController.prototype.renderUiForMessageResponse_ =
    function(messageResponse) {
  var unknownIds = this.addKnownIds_(messageResponse);
  goog.soy.renderElement(this.container_,
      messageboard.templates.messageviewer.messagesList, messageResponse);
  
  // Add randomized colors and angles.
  goog.array.shuffle(messageboard.MessageViewerController.AUTHOR_ANGLES);
  goog.array.shuffle(messageboard.MessageViewerController.AUTHOR_COLORS);
  goog.array.shuffle(messageboard.MessageViewerController.COMMENT_ANGLES);
  goog.array.shuffle(messageboard.MessageViewerController.COMMENT_COLORS);
  var authors = goog.dom.getElementsByClass(goog.getCssName('author'));
  goog.array.forEach(authors, goog.bind(function(authorEl, index) {
    goog.dom.classes.add(authorEl,
        goog.getCssName(messageboard.MessageViewerController.AUTHOR_ANGLES[
          index % messageboard.MessageViewerController.AUTHOR_ANGLES.length]),
        goog.getCssName(messageboard.MessageViewerController.AUTHOR_COLORS[
          index % messageboard.MessageViewerController.AUTHOR_COLORS.length]));
  }, this));
  var comments = goog.dom.getElementsByClass(goog.getCssName('comment'));
  goog.array.forEach(comments, goog.bind(function(commentEl, index) {
    goog.dom.classes.add(commentEl,
        goog.getCssName(messageboard.MessageViewerController.COMMENT_ANGLES[
          index % messageboard.MessageViewerController.COMMENT_ANGLES.length]),
        goog.getCssName(messageboard.MessageViewerController.COMMENT_COLORS[
          index % messageboard.MessageViewerController.COMMENT_COLORS.length]));
  }, this));

  // Use the Google+ API to figure out the missing authors.
  for (var i = 0; i < unknownIds.length; i++) {
    this.getGooglePlusId_(unknownIds[i]);
  }
};

/**
 * Attempts to use values from 
 * @param {messageboard.MessageResponse} messageResponse AppEngine response.
 * @return {Array.<string>} List of Google+ ids that were not found in storage.
 * @private
 */
messageboard.MessageViewerController.prototype.addKnownIds_ =
    function(messageResponse) {
  var messages = messageResponse['messages'];
  var unknownIds = [];
  for (var i = 0; i < messages.length; i++) {
    var message = messages[i];
    if (!this.addStoredGooglePlusInfo_(message)) {
      // Google+ id was not found and no fields were added to the message.
      message['display_name'] =
          messageboard.MessageViewerController.UNKNOWN_NAME;
      message['image_url'] =
          messageboard.MessageViewerController.UNKNOWN_PHOTO;
      goog.array.insert(unknownIds, message['google_plus_id']);
    }
  }
  return unknownIds;
};


/**
 * Get the name and thumbnail for the Google+ id.  Add the response to the page
 * and to localStorage.
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
 * @param {goog.events.BrowswerEvent} e Xhr event.
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
  this.logger.info('Changed image url to ' + imageUri.toString());

  // Add the Google+ info to all the author notes on the page.
  var imgs = goog.dom.getDocument().querySelectorAll('.gp-' + gPlusId + ' img');
  goog.array.forEach(imgs, function(imgEl) {
    imgEl.src = imageUri.toString();
  });
  var names = goog.dom.getDocument().querySelectorAll('.gp-' + gPlusId + ' h4');
  goog.array.forEach(names, function(nameEl) {
    nameEl.innerHTML = displayName; // Think about XSS risks.
  });
  this.storeGooglePlusInfo_(gPlusId, displayName, imageUrl);
};


/**
 * Adds the Google+ info into local storage so that this id won't need to be
 * retrieved in the future.
 *
 * @param {string} gPlusId Google+ id to save into local storage.
 * @param {string} displayName Name associated with the Google+ id.
 * @param {string} imageUrl Image associated with the Google+ id.
 */
messageboard.MessageViewerController.prototype.storeGooglePlusInfo_ =
    function(gPlusId, displayName, imageUrl) {
  var gPlusInfo = {'display_name': displayName,
                   'image_url': imageUrl};
  var gPlusInfoJson = goog.json.serialize(gPlusInfo);
  window.localStorage.setItem(gPlusId, gPlusInfoJson);
};


/**
 * Attempts to retrieve the Google+ id from local storage.  If the id is found
 * then the display_name and image_url are added to the message.  If the id is
 * not found then return false and add no fields.
 *
 * @param {string} gPlusId Google+ id to retrieve from local storage.
 * @param {messageboard.Message} message Individual message from the list
 *     retrieved from AppEngine.
 * @return {Boolean} True if the Google+ info was available in local storage.
 *     False if the Google+ id was not found in local storage.
 */
messageboard.MessageViewerController.prototype.addStoredGooglePlusInfo_ =
    function(message) {
  if (!message.hasOwnProperty('google_plus_id')) {
    return false;
  }
  var gPlusId = message['google_plus_id']; 
  var localStorageResult = window.localStorage.getItem(gPlusId);
  if (localStorageResult) {
    var gPlusInfo = goog.json.parse(localStorageResult);
    if (gPlusInfo.hasOwnProperty('display_name') &&
        gPlusInfo.hasOwnProperty('image_url')) {
      message['display_name'] = gPlusInfo['display_name'];
      message['image_url'] = gPlusInfo['image_url'];
      return true;
    }
  }
  return false;
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
