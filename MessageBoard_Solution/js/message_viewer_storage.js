
/**
 * @fileoverview Adds XHR results to local storage so that those calls don't
 * need to be made again.  Stores Google+ names and thumbnails using the id as
 * the key in localStorage.  Also stores the most recent message response.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */

goog.provide('messageboard.Message');
goog.provide('messageboard.MessageViewerStorage');

goog.require('goog.array');
goog.require('goog.json');


/**
 * Helper class to storage XHR responses that might be needed again.
 *
 * @constructor
 */
messageboard.MessageViewerStorage = function() {};
goog.addSingletonGetter(messageboard.MessageViewerStorage);


/**
 * Individual message from the backend.  Note this typedef is for documentation.
 * @typedef {{
 *   'comment': string,
 *   'created_date_time': string,
 *   'message_id': number,
 *   'google_plus_id': string}}
 */
messageboard.Message;


/**
 * Display name when no author name is found.
 * @type {string}
 * @const
 */
messageboard.MessageViewerStorage.UNKNOWN_NAME = 'Unknown';


/**
 * Link to the image that should be used if no image is found for author.
 * @type {string}
 * @const
 */
messageboard.MessageViewerStorage.UNKNOWN_PHOTO = 'images/no_photo_gitcat.png';


/**
 * Key used in localStorage to keep the most recent message response with
 * offset=0.  This could be used to get content on the screen before a response.
 * @type {string}
 * @const
 */
messageboard.MessageViewerStorage.MESSAGES_KEY = 'messages-key';


/**
 * Attempts to use values from localStorage to populate the displayed author
 * metadata on each message.  If an author's metadata is not found in local
 * storage then a default name and thumbnail are used.  Additionally there is
 * an array of unknown Google+ id's returned so they can be requested.
 *
 * @param {Array.<messageboard.Message>} messages Array of messages from the
 *     AppEngine backend that need to have known metadata added.
 * @return {Array.<string>} List of Google+ ids that were not found in storage.
 * @private
 */
messageboard.MessageViewerStorage.prototype.addKnownAuthorMetadata =
    function(messages) {
  var unknownIds = [];
  goog.array.forEach(messages, goog.bind(function(message){
    if (!this.addStoredGooglePlusInfo_(message)) {
      // Google+ id was not found and no fields were added to the message.
      message['display_name'] =
          messageboard.MessageViewerStorage.UNKNOWN_NAME;
      message['image_url'] =
          messageboard.MessageViewerStorage.UNKNOWN_PHOTO;
      goog.array.insert(unknownIds, message['google_plus_id']);
    }
    // Select colors to use so that this author is always the same color pair.
    var gPlusLen = message['google_plus_id'].length;
    if (gPlusLen > 4) {
      message['author_color'] = message['google_plus_id'].substring(3, 4);
      message['comment_color'] = message['google_plus_id']
          .substring(gPlusLen-1, gPlusLen);      
    } else {
      // Message with an invalid Google+ id;
      message['author_color'] = 0;
      message['comment_color'] = 1;
    }    
  }, this));
  return unknownIds;
};


/**
 * Attempts to retrieve the Google+ id from local storage.  If the id is found
 * then the display_name and image_url are added to the message.  If the id is
 * not found then return false and adds no fields.
 *
 * @param {messageboard.Message} message Individual message from the list
 *     retrieved from AppEngine.
 * @return {boolean} True if the Google+ info was available in local storage.
 *     False if the Google+ id was not found in local storage.
 */
messageboard.MessageViewerStorage.prototype.addStoredGooglePlusInfo_ =
    function(message) {
  if (!message.hasOwnProperty('google_plus_id')) {
    return false;
  }
  var gPlusId = message['google_plus_id']; 
  var localStorageResult = goog.global.localStorage.getItem(gPlusId);
  if (localStorageResult) {
    try {
      var gPlusInfo = goog.json.parse(localStorageResult);
    } catch (e) {
      return false;
    }
    if (gPlusInfo.hasOwnProperty('display_name') &&
        gPlusInfo.hasOwnProperty('image_url')) {
      message['display_name'] = gPlusInfo['display_name'];
      message['image_url'] = gPlusInfo['image_url'];
      return true;
    }
  }
  return false;
};


/**
 * Adds the Google+ info into local storage so that this id won't need to be
 * retrieved in the future.
 *
 * @param {string} gPlusId Google+ id to save into local storage.
 * @param {string} displayName Name associated with the Google+ id.
 * @param {string} imageUrl Image associated with the Google+ id.
 */
messageboard.MessageViewerStorage.prototype.storeGooglePlusInfo =
    function(gPlusId, displayName, imageUrl) {
  var gPlusInfo = {'display_name': displayName,
                   'image_url': imageUrl};
  var gPlusInfoJson = goog.json.serialize(gPlusInfo);
  goog.global.localStorage.setItem(gPlusId, gPlusInfoJson);
};


/**
 * Stores the most recent offset=0 messages received from the AppEngine backend.
 *
 * @param {Array.<messageboard.Message>} messages Array of messages from the
 *     AppEngine backend that were made with an offset=0 call.
 */
messageboard.MessageViewerStorage.prototype.storeMessages =
    function(messages) {
  var messagesJson = goog.json.serialize(messages);
  goog.global.localStorage.setItem(
      messageboard.MessageViewerStorage.MESSAGES_KEY,
      messagesJson);
};


/**
 * Returns the most recent offset=0 messages from localStorage or null.
 *
 * @return {Array.<messageboard.Message>} Array of offset=0 messages from
 *     localStorage. 
 */
messageboard.MessageViewerStorage.prototype.getMessages =
    function() {
  var messages = [];
  var jsonMessagesInStorage = goog.global.localStorage.getItem(
      messageboard.MessageViewerStorage.MESSAGES_KEY);
  if (jsonMessagesInStorage) {
    messages = /** @type {Array.<messageboard.Message>} */
        (goog.json.parse(jsonMessagesInStorage));
  }
  return messages;
};
