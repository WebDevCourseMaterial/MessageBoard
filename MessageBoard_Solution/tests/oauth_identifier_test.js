
/**
 * @fileoverview Unit tests for the oauth_identifier.js file.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */

// Mock gapi methods.

/** Objects under test. */
var oauthIdentifier;
var mockControl;
var eventHandler;
var stubs = new goog.testing.PropertyReplacer();;

function setUpPage() {
  goog.debug.LogManager.getRoot().setLevel(goog.debug.Logger.Level.INFO);
  var logconsole = new goog.debug.Console();
  logconsole.setCapturing(true);
  
  // Stub out the gapi authorize calls.
  stubs.set(messageboard.OAuthIdentifier.prototype,
      'authorizeBackground', goog.nullFunction);
  stubs.set(messageboard.OAuthIdentifier.prototype,
      'authorizePopUp', goog.nullFunction);
  oauthIdentifier = messageboard.OAuthIdentifier.getInstance();
}


function setUp() {
  eventHandler = new goog.events.EventHandler(oauthIdentifier);
  mockControl = new goog.testing.MockControl();
}

function tearDown() {
  goog.dispose(eventHandler);
  // Since it's a singleton, reset the state manually.
  oauthIdentifier.oauthToken = '';
  oauthIdentifier.gPlusId = '';
  oauthIdentifier.gPlusDisplayName = '';
  oauthIdentifier.gPlusThumbnail = '';
  oauthIdentifier.refreshToken_ = '';
  oauthIdentifier.tokenExpirationTimer_ = null;
}

function tearDownPage() {
  goog.dispose(oauthIdentifier);
  // Make sure dispose removes all listeners and DOM elements.
  assertEquals(0, goog.events.getTotalListenerCount());
}

function testInit() {
  // Make sure the script was added and global init function was made.
  var scriptTag = goog.dom.getElement('google-api-script');
  assertNotNull(scriptTag);
  assertNotNull(window.init);
}


/** Successful response sent to authorize callback. */
function testHandleAuthResult_success() {
  // Calls two functions, sets some variables and fires an event.
  var mockMakeCall = mockControl.createMethodMock(oauthIdentifier,
      'makeAuthenticatedIdCall');
  mockMakeCall();
  // Note, I want to remove this from the singleton later so use the two step
  // process of createFunctionMock + stubs instead of just createMethodMock.
  var mockScheduleTimer = mockControl.createFunctionMock(
      'scheduleOAuthRefreshTimer_');
  stubs.set(messageboard.OAuthIdentifier.prototype,
      'scheduleOAuthRefreshTimer_', mockScheduleTimer);
  mockScheduleTimer(goog.testing.mockmatchers.isNumber);
  var eventCallback = mockControl.createFunctionMock('eventCallback');
  eventCallback(goog.testing.mockmatchers.isObject);
  mockControl.$replayAll();
  eventHandler.listen(oauthIdentifier,
      messageboard.OAuthIdentifier.EventType.OAUTH_COMPLETE,
      eventCallback);
  var authResult = {
    'access_token': '12345',
    'refresh_token': 'abc',
    'expires_in': 3600
  };
  oauthIdentifier.handleAuthResult_(authResult);
  assertEquals('12345', oauthIdentifier.oauthToken);
  assertEquals('abc', oauthIdentifier.refreshToken_);
}


/** Unsuccessful response sent to authorize callback. */
function testHandleAuthResult_withError() {
  // Fires an event.
  var eventCallback = mockControl.createFunctionMock('eventCallback');
  eventCallback(goog.testing.mockmatchers.isObject);
  mockControl.$replayAll();
  eventHandler.listen(oauthIdentifier,
      messageboard.OAuthIdentifier.EventType.OAUTH_INCOMPLETE,
      eventCallback);
  var authResult = {
    'error': 'some error',
    'access_token': '12345',
    'refresh_token': 'abc',
    'expires_in': 3600
  };
  oauthIdentifier.handleAuthResult_(authResult);
  assertEquals('', oauthIdentifier.oauthToken);
  assertEquals('', oauthIdentifier.refreshToken_);
}


/** Unsuccessful response sent to authorize callback. */
function testHandleAuthResult_withUndefined() {
  // Fires an event.
  var eventCallback = mockControl.createFunctionMock('eventCallback');
  eventCallback(goog.testing.mockmatchers.isObject);
  mockControl.$replayAll();
  eventHandler.listen(oauthIdentifier,
      messageboard.OAuthIdentifier.EventType.OAUTH_INCOMPLETE,
      eventCallback);
  oauthIdentifier.handleAuthResult_();
  assertEquals('', oauthIdentifier.oauthToken);
  assertEquals('', oauthIdentifier.refreshToken_);
}


function testHandleAuthorizedGooglePlusResponse_success() {
  var xhr = new goog.net.XhrIo();
  var mockXhr = mockControl.createStrictMock(xhr);
  mockXhr.isSuccess().$returns(true);
  var response = {
    "id": "108456725833219286408",
    "displayName": "Dave Fisher",
    "image": {
      "url": 'https://lh5.googleusercontent.com/-vB9HMliwbIY/AAAAAAAAAAI/' +
      		'AAAAAAAAAAA/kVHRubd8QZM/photo.jpg?sz=50'
    }
  };
  mockXhr.getResponseJson().$returns(response);
  var eventCallback = mockControl.createFunctionMock('eventCallback');
  eventCallback(goog.testing.mockmatchers.isObject);
  
  mockControl.$replayAll();
  eventHandler.listen(oauthIdentifier,
      messageboard.OAuthIdentifier.EventType.GOOGLE_PLUS_ID_SUCCESS,
      eventCallback);
  oauthIdentifier.handleAuthorizedGooglePlusResponse_({target: mockXhr});

  assertEquals('108456725833219286408', oauthIdentifier.gPlusId);
  assertEquals('Dave Fisher', oauthIdentifier.gPlusDisplayName);
  assertEquals('https://lh5.googleusercontent.com/-vB9HMliwbIY/AAAAAAAAAAI/' +
      'AAAAAAAAAAA/kVHRubd8QZM/photo.jpg?sz=50',
      oauthIdentifier.gPlusThumbnail);
}


/** Response with an error. */
function testHandleAuthorizedGooglePlusResponse_withError() {
  var xhr = new goog.net.XhrIo();
  var mockXhr = mockControl.createStrictMock(xhr);
  mockXhr.isSuccess().$returns(true);
  var response = {
    "error": {
      "message": 'fake error message'
    }
  };
  mockXhr.getResponseJson().$returns(response);
  var eventCallback = mockControl.createFunctionMock('eventCallback');
  eventCallback(goog.testing.mockmatchers.isObject);
  mockControl.$replayAll();
  eventHandler.listen(oauthIdentifier,
      messageboard.OAuthIdentifier.EventType.GOOGLE_PLUS_ID_ERROR,
      eventCallback);
  oauthIdentifier.handleAuthorizedGooglePlusResponse_({target: mockXhr});
  assertEquals('', oauthIdentifier.gPlusId);
  assertEquals('', oauthIdentifier.gPlusDisplayName);
  assertEquals('', oauthIdentifier.gPlusThumbnail);
}


/** Unsuccessful response from googleapis. */
function testHandleAuthorizedGooglePlusResponse_with404() {
  var xhr = new goog.net.XhrIo();
  var mockXhr = mockControl.createStrictMock(xhr);
  mockXhr.isSuccess().$returns(false);
  mockXhr.getStatus().$returns('Fake 404');
  var eventCallback = mockControl.createFunctionMock('eventCallback');
  eventCallback(goog.testing.mockmatchers.isObject);
  mockControl.$replayAll();
  eventHandler.listen(oauthIdentifier,
      messageboard.OAuthIdentifier.EventType.GOOGLE_PLUS_ID_ERROR,
      eventCallback);
  oauthIdentifier.handleAuthorizedGooglePlusResponse_({target: mockXhr});

  // Silently does nothing.
  assertEquals('', oauthIdentifier.gPlusId);
  assertEquals('', oauthIdentifier.gPlusDisplayName);
  assertEquals('', oauthIdentifier.gPlusThumbnail);
}

/** Make sure a timer is scheduled. */
function testScheduleOAuthRefreshTimer() {
//  // Reset the original function to get back scheduleOAuthRefreshTimer_
  stubs.reset();
//  // Put back on the authorize calls.
  stubs.set(messageboard.OAuthIdentifier.prototype,
      'authorizeBackground', goog.nullFunction);
  stubs.set(messageboard.OAuthIdentifier.prototype,
      'authorizePopUp', goog.nullFunction);
  oauthIdentifier.scheduleOAuthRefreshTimer_();
  assertTrue(oauthIdentifier.tokenExpirationTimer_.isActive());
}

function testCancelOAuthRefreshTimer() {
  oauthIdentifier.scheduleOAuthRefreshTimer_();
  oauthIdentifier.cancelOAuthRefreshTimer_();
  assertNull(oauthIdentifier.tokenExpirationTimer_);
}

function testHandleOAuthRefreshTimeout_success() {
  var eventCallback = mockControl.createFunctionMock('eventCallback');
  eventCallback(goog.testing.mockmatchers.isObject);
  mockControl.$replayAll();

  
  eventHandler.listen(oauthIdentifier,
      messageboard.OAuthIdentifier.EventType.OAUTH_REFRESHED,
      eventCallback);
  oauthIdentifier.handleOAuthRefreshTimeout_();
}

