
/**
 * @fileoverview Unit tests for the message_viewer_controller.js file.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */


/** Objects under test. */
var messageViewerController;
var mockControl;
var stubs = new goog.testing.PropertyReplacer();

function setUpPage() {
}


function setUp() {
  mockControl = new goog.testing.MockControl();
  stubs.set(messageboard.MessageViewerController.prototype,
      'updateMessages', goog.nullFunction);
  messageViewerController =
      new messageboard.MessageViewerController(goog.dom.getElement('test-div'));
}


function tearDown() {
  goog.dispose(messageViewerController);
  // Make sure dispose removes all listeners and DOM elements.
  var testDivEl = goog.dom.getElement('test-div');
  assertEquals(0, goog.dom.getChildren(testDivEl).length);
  assertEquals(0, goog.events.getTotalListenerCount());
}


function testUpdateMessages_isCalled() {
  stubs.reset();
  var mockUpdateMessages = mockControl.createFunctionMock('mockUpdateMessages');
  mockUpdateMessages();
  stubs.set(messageboard.MessageViewerController.prototype,
      'updateMessages', mockUpdateMessages);
  mockControl.$replayAll();
  var tempController = new messageboard.MessageViewerController(goog.dom.getElement('test-div'));
  mockControl.$verifyAll();
  goog.dispose(tempController);
}


function testHandleMessagesResponse() {
  var xhr = new goog.net.XhrIo();
  var mockXhr = mockControl.createStrictMock(xhr);
  mockXhr.isSuccess().$returns(true);
  var message1 = {
      'comment': 'Add this message',
      'created_date_time': '2012-07-23T08:28:01.574010',
      'message_id': 1,
      'google_plus_id': '12345'};
  var response = {
      'status': 'success',
      'messages': [message1]};
  mockXhr.getResponseJson().$returns(response);
  var mockRenderUiForMessages = mockControl.createFunctionMock(
      'mockRenderUiForMessages');
  stubs.set(messageboard.MessageViewerController.prototype,
      'renderUiForMessages_', mockRenderUiForMessages);
  mockRenderUiForMessages([message1]);
  mockControl.$replayAll();
  messageViewerController.handleMessagesResponse_({target: mockXhr});
  mockControl.$verifyAll(); 
}


function testHandleMessagesResponse_error() {
  var xhr = new goog.net.XhrIo();
  var mockXhr = mockControl.createStrictMock(xhr);
  mockXhr.isSuccess().$returns(true);
  var response = {
      'error': 'testError'};
  mockXhr.getResponseJson().$returns(response);
  var mockRenderUiForMessages = mockControl.createFunctionMock(
      'mockRenderUiForMessages');
  stubs.set(messageboard.MessageViewerController.prototype,
      'renderUiForMessages_', mockRenderUiForMessages);
  mockControl.$replayAll();
  messageViewerController.handleMessagesResponse_({target: mockXhr});
  mockControl.$verifyAll();  // Confirm no mock calls. 
}


function testRenderUiForMessages() {
  
}


function testGetGooglePlusId() {
  
}


function testHandleGooglePlusApiResponse() {
  
}
