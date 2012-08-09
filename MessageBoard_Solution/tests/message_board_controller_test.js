
/**
 * @fileoverview Unit tests for the message_board_controller.js file.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */


/** Objects under test. */
var messageBoardController;
var stubs = new goog.testing.PropertyReplacer();

function setUpPage() {
}


function setUp() {

}


function tearDown() {
  goog.dispose(messageBoardController);
  // Make sure dispose removes all listeners and DOM elements.
  var testDivEl = goog.dom.getElement('test-div');
  assertEquals(0, goog.dom.getChildren(testDivEl).length);
  assertEquals(0, goog.events.getTotalListenerCount());
}


function testMath() {
  assertEquals(2, 2);
}
