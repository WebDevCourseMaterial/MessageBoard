
/**
 * @fileoverview Unit tests for the message_viewer_storage.js file.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */


/** Objects under test. */
var messageViewerStorage = messageboard.MessageViewerStorage.getInstance();
var mockControl;
var stubs = new goog.testing.PropertyReplacer();
var message1;
var message2;
var message3;

function setUpPage() {
}


function setUp() {
  mockControl = new goog.testing.MockControl();
  message1 = {
      'comment': 'message 1',
      'google_plus_id': '012345'};
  message2 = {
      'comment': 'message 2',
      'google_plus_id': '0123456'};
  message3 = {
      'comment': 'message 3',
      'google_plus_id': '01234567'};
}


function tearDown() {
  stubs.reset();
}


function testAddKnownAuthorMetadata() {
  var mockAddStoredGooglePlusInfo = mockControl.createFunctionMock(
      'mockAddStoredGooglePlusInfo');
  stubs.set(messageboard.MessageViewerStorage.prototype,
      'addStoredGooglePlusInfo_', mockAddStoredGooglePlusInfo);
  mockAddStoredGooglePlusInfo(message1).$returns(false);
  mockAddStoredGooglePlusInfo(message2).$returns(true);
  mockAddStoredGooglePlusInfo(message3).$returns(false);
  mockControl.$replayAll();
  var messages = [message1, message2, message3];
  var unknownIds = messageViewerStorage.addKnownAuthorMetadata(messages);
  assertEquals(messageboard.MessageViewerStorage.UNKNOWN_NAME,
      messages[0].display_name);
  assertEquals(messageboard.MessageViewerStorage.UNKNOWN_PHOTO,
      messages[0].image_url);
  assertEquals('3', messages[0].author_color);
  assertEquals('5', messages[0].comment_color);
  assertUndefined(messages[1].display_name);
  assertUndefined(messages[1].image_url);
  assertEquals('3', messages[1].author_color);
  assertEquals('6', messages[1].comment_color);
  assertEquals(messageboard.MessageViewerStorage.UNKNOWN_NAME,
      messages[2].display_name);
  assertEquals(messageboard.MessageViewerStorage.UNKNOWN_PHOTO,
      messages[2].image_url);
  assertEquals('3', messages[2].author_color);
  assertEquals('7', messages[2].comment_color);
  assertEquals(2, unknownIds.length);
  assertEquals(message1.google_plus_id, unknownIds[0]);
  assertEquals(message3.google_plus_id, unknownIds[1]);
  mockControl.$verifyAll();
}


function testAddStoredGooglePlusInfo_notFound() {
  var found = messageViewerStorage.addStoredGooglePlusInfo_(message1);
  assertFalse(found);
  found = messageViewerStorage.addStoredGooglePlusInfo_({});
  assertFalse(found);
}


function testAddStoredGooglePlusInfo_foundGarbage() {
  goog.global.localStorage.setItem(message1.google_plus_id, 'garbage');
  var found = messageViewerStorage.addStoredGooglePlusInfo_(message1);
  assertFalse(found);
}


function testAddStoredGooglePlusInfo_found() {
  var inStorage = {display_name: 'Dave', image_url: 'imgSrc'};
  var inStorageJson = goog.json.serialize(inStorage);
  goog.global.localStorage.setItem(message1.google_plus_id, inStorageJson);
  var found = messageViewerStorage.addStoredGooglePlusInfo_(message1);
  assertTrue(found);
  assertEquals('Dave', message1.display_name);
  assertEquals('imgSrc', message1.image_url);
}

function testStoreGooglePlusInfo() {
  messageViewerStorage.storeGooglePlusInfo('abc', 'Dave', 'imgUrl');
  var inStorage = goog.json.parse(goog.global.localStorage.getItem('abc'));
  assertEquals('Dave', inStorage.display_name);
  assertEquals('imgUrl', inStorage.image_url);
}

function testStoreAndGetMessages() {
  var messages = [message1, message2, message3];
  messageViewerStorage.storeMessages(messages);
  assertArrayEquals(messages, messageViewerStorage.getMessages());
}
