
/**
 * @fileoverview Controls the authoring of rose-message-baord messages.
 *
 * @author fisherds@gmail.com (Dave Fisher)
 */

goog.provide('messageboard.MessagePostController');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventHandler');
goog.require('goog.json');
goog.require('goog.net.XhrIo');
goog.require('goog.net.CrossDomainRpc');
goog.require('goog.soy');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Css3ButtonRenderer');
goog.require('messageboard.OAuthIdentifier');
goog.require('messageboard.templates.messagepost');



/**
 * Controller used author messages sent to the rose-message-board.
 *
 * @param {!Element} container The element for this controller's content.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
messageboard.MessagePostController = function(container) {
  goog.base(this);
  
  /**
   * Container element for this controller's content.
   * @type {!Element}
   * @private
   */
  this.container_ = container;

  /**
   * @type {goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = null;

  /**
   * 
   * @type {messageboard.OAuthIdentifier}
   * @private
   */
  this.oauthHelper_ = messageboard.OAuthIdentifier.getInstance();
  
  
  
  /**
   * Holds events that should only be removed when the controller is disposed.
   * @type {goog.events.EventHandler}
   * @private
   */
  this.eventHandler_ = new goog.events.EventHandler(this);
  
  this.init_();
  
};
goog.inherits(messageboard.MessagePostController, goog.events.EventTarget);


messageboard.MessagePostController.prototype.init_ = function() {
//  goog.soy.renderElement(this.container_,
//      messageboard.templates.messagepost.postOverlay);


  goog.soy.renderElement(this.container_,
      messageboard.templates.messagepost.postOverlayNotSignedIn);
  
  

  var buttonControl = new goog.ui.CustomButton('',
      goog.ui.Css3ButtonRenderer.getInstance());
  buttonControl.setSupportedState(goog.ui.Component.State.FOCUSED, false);
  buttonControl.setSupportedState(goog.ui.Component.State.DISABLED, false);
  buttonControl.decorate(goog.dom.getElementByClass(goog.getCssName('button')));
  this.eventHandler_.listen(buttonControl, goog.ui.Component.EventType.ACTION,
      this.buttonClick_);

  
  
  
  // TODO make a button and call
  
  
  
/*
  // Add the Google API client script.
  var clientScript = goog.dom.createDom('script');
  clientScript.type = 'text/javascript';
  clientScript.async = true;
//  var scriptSrcUri = new goog.Uri('https://apis.google.com/js/client.js');
//  scriptSrcUri.setParameterValues('onload',
//      'messageboard.MessagePostController.handleClientLoad');
  
  var scriptSrcUri = new goog.Uri('https://apis.google.com/js/auth.js');
  scriptSrcUri.setParameterValues('onload',
      'messageboard.MessagePostController.handleClientLoad');

    
  clientScript.src = scriptSrcUri.toString();
  var firstScript = goog.dom.getElementsByTagNameAndClass('script')[0];
  goog.dom.insertSiblingBefore(clientScript, firstScript);
  */

  
  this.keyHandler_ = new goog.events.KeyHandler(
      goog.dom.getElement('post-input'));
  this.eventHandler_.listen(this.keyHandler_,
      goog.events.KeyHandler.EventType.KEY, this.onKeyEvent_);
};


messageboard.MessagePostController.prototype.buttonClick_ = function(e) {
  this.logger.info('You clicked the button');
  this.oauthHelper_.authorizePopUp();
  
};


/**
 * Logger for this class.
 * @type {goog.debug.Logger}
 */
messageboard.MessagePostController.prototype.logger =
    goog.debug.Logger.getLogger('messageboard.MessagePostController');


/**
 * Listener for key press events.
 * @param {goog.events.KeyEvent} e Key event.
 * @private
 */
messageboard.MessagePostController.prototype.onKeyEvent_ = function(e) {
  switch (e.keyCode) {
    case goog.events.KeyCodes.ENTER:
      this.submitMessage_();
      break;
  }
};


/**
 * 
 */
messageboard.MessagePostController.prototype.submitMessage_ = function() {
  this.logger.info('Submit the text in the box.');  

  var postValue = goog.dom.getElement('post-input').value;
  var newMessage = {'google_plus_id': '108456725833219286408', 'comment': postValue};
  goog.dom.getElement('post-input').value = '';

//  goog.net.XhrIo.prototype.withCredentials_ = true;
  
  
  var postBodyJson = goog.json.serialize(newMessage);
  goog.net.XhrIo.send(
      '/api',
      goog.bind(this.handleXhrResponse_, this),
      'POST',
      postBodyJson,
      {'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'});

//  var xhr = new goog.net.XhrIo();
//  xhr.setWithCredentials(true);
//  xhr.addEventListener(goog.net.EventType.COMPLETE, goog.bind(this.handleXhrResponse_, this)),
//  xhr.send(
//      'http://rose-message-board.appspot.com',
//      'POST',
//      postBodyJson,
//      {'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest'});
  
//  goog.net.CrossDomainRpc.send('http://rose-message-board.appspot.com',
//      function(e) {
//    window.console.log("Response back" + e.responseText);
//  });
};

messageboard.MessagePostController.prototype.handleXhrResponse_ = function(e) {

  var xhr = /** @type {goog.net.XhrIo} */ (e.target);  
  if (!xhr.isSuccess()) {
    this.logger.warning('Xhr POST requested failed with status ' +
        xhr.getStatus());
    return;
  }
  var messageResponse = xhr.getResponseJson();
  if (messageResponse.hasOwnProperty('error')) {
    this.logger.warning('Error getting messageboard. ' +
        messageResponse['error']);
    return;
  }
  this.logger.info('Status = ' + messageResponse['status']);
  this.logger.info('Message = ' + messageResponse['message']);
};


/** inheritDoc */
messageboard.MessagePostController.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');

  // Remove listeners added.
  this.eventHandler_.removeAll();
  goog.dispose(this.eventHandler_);
  delete this.eventHandler_;
  
  // Remove the DOM elements.
  goog.dom.removeChildren(this.container_);
};
