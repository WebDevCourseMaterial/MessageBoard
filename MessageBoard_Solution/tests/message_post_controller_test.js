
/**
 * @fileoverview Unit tests for the message_post_controller.js file.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */


/** Objects under test. */
var messagePostController;
var mockControl;
var eventHandler;
var mockOAuthIdentifier;
var stubs = new goog.testing.PropertyReplacer();

function setUpPage() {
  // Add a logconsole to the page for logs form the class under test.
  goog.debug.LogManager.getRoot().setLevel(goog.debug.Logger.Level.INFO);
  var logconsole = new goog.debug.Console();
  logconsole.setCapturing(true);
}


function setUp() {
  mockControl = new goog.testing.MockControl();
  var oauthIdentifier = new messageboard.OAuthIdentifier();
  mockOAuthIdentifier = mockControl.createLooseMock(oauthIdentifier);
  // Don't call init_ during construction.  Test separate.
  stubs.set(messageboard.MessagePostController.prototype,
      'init_', goog.nullFunction);
  messagePostController = new messageboard.MessagePostController(
      goog.dom.getElement('test-div'),
      mockOAuthIdentifier);
  // Handler used to test if events are fired properly.
  eventHandler = new goog.events.EventHandler(messagePostController);
}


function tearDown() {
  stubs.reset();
  goog.dispose(messagePostController);
  goog.dispose(eventHandler);
  // Make sure dispose removes all listeners and DOM elements.
  var testDivEl = goog.dom.getElement('test-div');
  assertEquals(0, goog.dom.getChildren(testDivEl).length);
  assertEquals(0, goog.events.getTotalListenerCount());
}


function testInit() {
  stubs.reset();  // Put back the init_ function.
  mockOAuthIdentifier.initialize();
  mockControl.$replayAll();
  messagePostController.init_();
  assertEquals(3, goog.events.getTotalListenerCount());
  mockControl.$verifyAll();  // Call manually since it's a loose mock.
}


function testRenderOAuthButton() {
  messagePostController.renderOAuthButton_();
  // Mainly just making sure the tearDown clean up tests pass.
}


function testRenderPostOverly() {
  messagePostController.renderPostOverly_('http://someimage.jpg');
  // Mainly just making sure the tearDown clean up tests pass.
}


function testOnKeyEvent_withEnter() {
  var mockSubmitMessage = mockControl.createFunctionMock('mockSubmitMessage');
  stubs.set(messageboard.MessagePostController.prototype,
      'submitMessage_', mockSubmitMessage);
  mockSubmitMessage();
  mockControl.$replayAll();
  messagePostController.onKeyEvent_({keyCode: 13});
}


function testOnKeyEvent_notEnter() {
  var mockSubmitMessage = mockControl.createFunctionMock('mockSubmitMessage');
  stubs.set(messageboard.MessagePostController.prototype,
      'submitMessage_', mockSubmitMessage);
  mockControl.$replayAll();
  messagePostController.onKeyEvent_({keyCode: 77});
  mockControl.$verifyAll();
}


function testHandleXhrResponse() {
  var xhr = new goog.net.XhrIo();
  var mockXhr = mockControl.createStrictMock(xhr);
  mockXhr.isSuccess().$returns(true);
  var response = {
    'status': '',
    'message': {
      'comment': 'Add this message',
      'created_date_time': '2012-07-23T08:28:01.574010',
      'message_id': 1,
      'google_plus_id': '12345'
    }
  };
  mockXhr.getResponseJson().$returns(response);
  var eventCallback = mockControl.createFunctionMock('eventCallback');
  eventCallback(goog.testing.mockmatchers.isObject);
  mockControl.$replayAll();
  eventHandler.listen(messagePostController,
      messageboard.MessagePostController.EventType.NEW_MESSAGE_POSTED,
      eventCallback);
  messagePostController.handleXhrResponse_({target: mockXhr});  
}
