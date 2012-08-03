
/**
 * @fileoverview Unit tests for the message_post_controller.js file.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */


/** Objects under test. */
var messagePostController;
var stubs = new goog.testing.PropertyReplacer();

function setUpPage() {
}


function setUp() {

}


function tearDown() {
  goog.dispose(messagePostController);
  // Make sure dispose removes all listeners and DOM elements.
  var testDivEl = goog.dom.getElement('testDiv');
  assertEquals(0, goog.dom.getChildren(testDivEl).length);
  assertEquals(0, goog.events.getTotalListenerCount());
}


function testMath() {
  assertEquals(2, 2);
}
