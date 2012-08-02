
/**
 * @fileoverview Uses a Google api script to perform OAuth then makes an
 * authenticated call to the Google+ API to retrieve a display name, Google+ id,
 * and thumbnail for the logged in Google account user.
 * 
 * Learn more about using Google API via the explorer.
 * https://developers.google.com/apis-explorer/#p/
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */

goog.provide('messageboard.OAuthIdentifier');
goog.provide('messageboard.OAuthIdentifier.OAuthCompleteEvent');
goog.provide('messageboard.OAuthIdentifier.GooglePlusIdSuccessEvent');
goog.provide('messageboard.OAuthIdentifier.OAuthResult');

goog.require('goog.Uri');
goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.net.XhrIo');
goog.require('goog.string');


/**
 * Creates a helper to do OAuth and make a call to the Google+ API to get the
 * end users Google+ id, thumbnail, and name.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
messageboard.OAuthIdentifier = function() {

  /**
   * OAuth token from the gapi client.
   * @type {string}
   * @private
   */
  this.oauthToken_ = '';
  
  /**
   * Timer that will refresh the OAuth token just before it expires.  Typically
   * an OAuth token will expire in 1 hour (3600 seconds).
   * @type {goog.async.Delay}
   * @private
   */
  this.tokenExpirationTimer_ = null;
  
  this.init_();
};
goog.inherits(messageboard.OAuthIdentifier, goog.events.EventTarget);


/**
 * Events that can be fired by instances of this class.
 * @enum {string}
 */
messageboard.OAuthIdentifier.EventType = {
    OAUTH_INCOMPLETE: goog.events.getUniqueId('oauth-incomplete'),
    OAUTH_COMPLETE: goog.events.getUniqueId('oauth-complete'),
    GOOGLE_PLUS_ID_ERROR: goog.events.getUniqueId('google-plus-id-error'),
    GOOGLE_PLUS_ID_SUCCESS: goog.events.getUniqueId('google-plus-id-success')
};


/**
 * @typedef {{
 *   'access_token': string,
 *   'token_type': string,
 *   'expires_in': number,
 *   'id_token: string,
 *   'refresh_token': string
 * }}
 */
messageboard.OAuthResult;



/**
 * Event fired upon successful OAuth completion.
 *
 * @param {messageboard.OAuthIdentifier} oauthIdentifier Object throwing event.
 * @param {messageboard.OAuthIdentifier.OAuthResult} oauthResult The result
 *     from the gapi client which contains the OAuth token.
 * @constructor
 * @extends {goog.events.Event}
 */
messageboard.OAuthIdentifier.OAuthCompleteEvent =
    function(oauthIdentifier, oauthResult) {
  goog.base(this, messageboard.OAuthIdentifier.EventType.OAUTH_COMPLETE,
      oauthIdentifier);
  /**
   * A successful OAuth result from the gapi client.
   * @type {messageboard.OAuthIdentifier.OAuthResult}
   */
  this.oauthResult = null;
};
goog.inherits(messageboard.OAuthIdentifier.OAuthCompleteEvent,
              goog.events.Event);




/**
 * Event fired upon successful completion of the Google+ API call to identify
 * the end user.
 *
 * @param {messageboard.OAuthIdentifier} oauthIdentifier Object throwing event.
 * @param {string} gPlusId Google+ id of the end user.
 * @param {string} gPlusDisplayName Google+ display name of the end user.
 * @param {string} gPlusThumbnail Google+ image url of the end user.
 * @constructor
 * @extends {goog.events.Event}
 */
messageboard.OAuthIdentifier.GooglePlusIdSuccessEvent =
    function(oauthIdentifier, gPlusId, gPlusDisplayName, gPlusThumbnail) {
  /**
   * Google+ id of the end user.
   * @type {string} 
   */
  this.gPlusId = gPlusId;

  /**
   * Google+ display name of the end user.
   * @type {string} 
   */
  this.gPlusDisplayName = gPlusDisplayName;

  /**
   * Google+ image url of the end user.
   * @type {string} 
   */
  this.gPlusThumbnail = gPlusThumbnail;
};
goog.inherits(messageboard.OAuthIdentifier.GooglePlusIdSuccessEvent,
              goog.events.Event);


/**
 * Google API key generated at https://developers.google.com/console/
 * 
 *            CHANGE THIS TO YOUR OWN CLIENT ID
 *            
 * @type {string}
 * @const
 */
messageboard.OAuthIdentifier.API_KEY = 'AIzaSyC4hhfmlBAmxe269S-_2xXr8fUKFAF7qrI';


/**
 * Client id generated at https://developers.google.com/console/
 * 
 *            CHANGE THIS TO YOUR OWN API KEY
 *            
 * @type {string}
 * @const
 */
messageboard.OAuthIdentifier.CLIENT_ID = '729252021447';


/**
 * Scopes determine the amount of access that a user gives your app.  Here we
 * only need plus.me, but userinfo.email was added for example purposes.
 * @type {string}
 * @const
 */
messageboard.OAuthIdentifier.SCOPES =
    'https://www.googleapis.com/auth/plus.me ' +
    'https://www.googleapis.com/auth/userinfo.email';


/**
 * GET request Url to for the plus.people.get API.
 * @type {string}
 * @const
 */
messageboard.OAuthIdentifier.GOOGLE_PLUS_PEOPLE_REQUEST = 
    'https://www.googleapis.com/plus/v1/people/me';


/**
 * Logger for this class.
 * @type {goog.debug.Logger}
 */
messageboard.OAuthIdentifier.prototype.logger =
    goog.debug.Logger.getLogger('messageboard.OAuthIdentifier');


/**
 * Initialize by adding the script and callback function.
 */
messageboard.OAuthIdentifier.prototype.init_ = function() {  
  // Add the Google API client script to the DOM.
  var clientScript = goog.dom.createDom(
      'script',
      {
        'id': 'google-api-script',
        'type': 'text/javascript',
        'src': 'https://apis.google.com/js/auth.js?onload=init'
      });
  var firstScript = goog.dom.getElementsByTagNameAndClass('script')[0];
  goog.dom.insertSiblingBefore(clientScript, firstScript);
  
  this.logger.info('Added the gapi script. Waiting for it to call init.');
  var oauthInstance = this;
  // This function has been added to the global object (ie window) so that it
  // can easily be used in a JSONP callback by Google's OAuth script.
  goog.global['init'] = function() {
    this.logger.info('Init called.  Attempt to background authorize.');
    new goog.async.Delay(goog.bind(function() {
      this.authorizeBackground();
    }, oauthInstance), 1);  
  };
    
//    window.console.log('Added the script.  Loading auth and attempting a background authorize.');
//    window.setTimeout(goog.bind(function() {
//      window['gapi']['load']('auth', goog.bind(function() {
//        window.setTimeout(this.authorizeBackground, 1000);    
//      }, this));
//    }, this), 1000);
};


/**
 * Attempts to authenticate the user assuming they have previously authorized
 * the scopes.  Never pops up a window.  This function will only work if the
 * end user is currently logged in and has previously authorized the scopes.
 */
messageboard.OAuthIdentifier.prototype.authorizeBackground = function() {
  this.logger.info('Attempt to authenticate silently in the background');
  goog.global['gapi']['auth']['authorize'](
      {
        'client_id': messageboard.OAuthIdentifier.CLIENT_ID,
        'scope': messageboard.OAuthIdentifier.SCOPES,
        'immediate': true
      },
      goog.bind(this.handleAuthResult_, this));
};


/**
 * Authenticate and authorize the end user via pop up window.  This will always
 * launch a popup window that will help the end user log in (or create a Google
 * account) and ask for permission to get their id.
 */
messageboard.OAuthIdentifier.prototype.authorizePopUp = function() {
  this.logger.info('Launch a popup window for OAuth.');
  window['gapi']['auth']['authorize'](
      {
        'client_id': messageboard.OAuthIdentifier.CLIENT_ID,
        'scope': messageboard.OAuthIdentifier.SCOPES,
        'immediate': false
      },
      goog.bind(this.handleAuthResult_, this));
};


/**
 * Callback function to process the authorize response from the gapi authorize
 * call.
 *
 * @param {messageboard.OAuthResult} authResult Response from gapi following
 *     an oauth attempt.  Will include an error field if it didn't work. 
 * @private
 */
messageboard.OAuthIdentifier.prototype.handleAuthResult_ = function(authResult) {
  this.logger.info('Received a OAuth result from gapi.  Did it work? . . .');
  if (authResult && !authResult['error']) {
   this.logger.info('OAuth complete!  The token has landed!');
   this.oauth_token = authResult['access_token'];
   this.schedule_timer(authResult['expires_in']);
   this.makeAuthenticatedIdCall();
   this.dispatchEvent(new messageboard.OAuthIdentifier.OAuthCompleteEvent(
       this, authResult));
  } else {
    this.logger.info('Not authorized yet. Wait for user to click on the ' +
        'authenticate button to trigger the popup.');
    this.dispatchEvent(messageboard.OAuthIdentifier.EventType.OAUTH_INCOMPLETE);
  }
};


/**
 * Make an authenticated Google+ API call to get the end user identity. 
 */
messageboard.OAuthIdentifier.prototype.makeAuthenticatedIdCall = function() {
  if (goog.string.isEmpty(this.oauthToken_)) {
    this.oauthToken_ = goog.global['gapi']['auth']['getToken'](); 
  }
  //var request = 'https://www.googleapis.com/plus/v1/people/me?key=' + messageboard.OAuthIdentifier.API_KEY;
  var requestUri = new goog.Uri(messageboard.OAuthIdentifier.GOOGLE_PLUS_PEOPLE_REQUEST);
  // Limit the response fields to only the data we want (optional).
  requestUri.setParameterValue('fields', 'displayName,id,image');
  requestUri.setParameterValue('key', messageboard.OAuthIdentifier.API_KEY);
  //https://www.googleapis.com/plus/v1/people/me?fields=displayName%2Cid%2Cimage&key={YOUR_API_KEY}
  this.logger.info('Making request ' + requestUri.toString());
  goog.net.XhrIo.send(
      requestUri.toString(),
      goog.bind(this.handleAuthorizedGooglePlusResponse_, this),
      'GET',
      null,
      {'Authorization': 'Bearer ' + oauthToken['access_token']});
};


/**
 * Callback for the Google+ API Xhr.
 *
 * @param {goog.events.BrowserEvent} e Response from authenticated request.
 */
messageboard.OAuthIdentifier.prototype.handleAuthorizedGooglePlusResponse_ =
    function(e) {
  var xhr = /** @type {goog.net.XhrIo} */ (e.target);
  if (!xhr.isSuccess()) {
    this.logger.warning('Authenticated Google+ request failed with status ' +
        xhr.getStatus());
    this.dispatchEvent(
        messageboard.OAuthIdentifier.EventType.GOOGLE_PLUS_ID_ERROR);
    return;
  }
  var apiResponse = xhr.getResponseJson();
  if (apiResponse.hasOwnProperty('error')) {
    this.logger.warning('Error getting Authenticated Google+ request. ' +
        apiResponse['error']['message']);
    this.dispatchEvent(
        messageboard.OAuthIdentifier.EventType.GOOGLE_PLUS_ID_ERROR);
    return;
  }
  var gPlusId = apiResponse['id'];
  var gPlusDisplayName = apiResponse['displayName'];
  var gPlusThumbnail = apiResponse['image']['url'];
  this.logger.info('gPlusId = ' + gPlusId);
  this.logger.info('gPlusDisplayName = ' + gPlusDisplayName);
  this.logger.info('gPlusThumbnail = ' + gPlusThumbnail);
  this.dispatchEvent(new messageboard.OAuthIdentifier.GooglePlusIdSuccessEvent(
      oauthIdentifier, gPlusId, gPlusDisplayName, gPlusThumbnail));
};
