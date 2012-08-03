
/**
 * @fileoverview Unit tests for the oauth_identifier.js file.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */


/** Objects under test. */
var oauth_identifier;
var stubs = new goog.testing.PropertyReplacer();

function setUpPage() {
}


function setUp() {

}


function tearDown() {
  goog.dispose(oauth_identifier);
  // Make sure dispose removes all listeners and DOM elements.
  var testDivEl = goog.dom.getElement('testDiv');
  assertEquals(0, goog.dom.getChildren(testDivEl).length);
  assertEquals(0, goog.events.getTotalListenerCount());
}


function testMath() {
  assertEquals(2, 2);
}
