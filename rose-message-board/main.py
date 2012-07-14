#!/usr/bin/env python
# Simple backend for storing a message list.
#
# How do I...
#   Get 10 results:  XMLHttpRequest GET request to rose-message-board.appspot.com
#   Get 12 results:  XMLHttpRequest GET request to rose-message-board.appspot.com?maxResults=12
#   Create a new message: XMLHttpRequest POST request to rose-message-board.appspot.com
#       with a POST body {"google_plus_id": "12345", "comment": "Hello Dave"}
#   Edit a new message: XMLHttpRequest POST request to rose-message-board.appspot.com
#       with a POST body {"message_id": 15, "comment": "Hello David"}
#   Delete a new message: XMLHttpRequest POST request to rose-message-board.appspot.com
#       with a POST body {"message_id": 15}


from google.appengine.ext import ndb
import datetime
import json
import webapp2

class Message(ndb.Model):
	google_plus_id = ndb.StringProperty(required=True)
	comment = ndb.StringProperty(indexed=False, default='')
	created_date_time = ndb.DateTimeProperty(auto_now_add=True)

class MainHandler(webapp2.RequestHandler):
	def get(self):
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.headers.add_header("Access-Control-Allow-Origin", "*")
		requested_results = 10
		MAX_RESULTS = 50
		if self.request.get('maxResults'):
			try:
				requested_results = int(self.request.get('maxResults'))
				if requested_results > MAX_RESULTS:
					requested_results = MAX_RESULTS
			except:
				logging.warning("Error setting maxResults")	
		messageList =[]
		messages = Message.query().order(-Message.created_date_time).fetch(requested_results)		
		for message in messages:
			messageDict = message.to_dict()
			messageDict['message_id'] = message.key.id()
			messageList.append(messageDict)		
		response = {'messages': messageList, 'status': 'success'}
		self.response.out.write(json.dumps(response, default=self.date_time_handler))

	def date_time_handler(self, obj):
		if hasattr(obj, 'isoformat'):
			return obj.isoformat()
		return obj

	def post(self):	
		self.response.headers['Content-Type'] = "text/plain"
		postBody = json.loads(self.request.body)
		if 'message_id' in postBody:
			existingMessage = Message.get_by_id(postBody['message_id'])
			if existingMessage:
				editMade = False
				if 'google_plus_id' in postBody:
					existingMessage.google_plus_id = postBody['google_plus_id']
					editMade = True
				if 'comment' in postBody:
					existingMessage.comment = postBody['comment']
					editMade = True
				if 'created_date_time' in postBody:
					existingMessage.created_date_time = datetime.datetime.strptime(
						postBody['created_date_time'], "%Y-%m-%dT%H:%M:%S.%f")
					editMade = True
				if editMade:
					existingMessage.put()
					response = {'messages': existingMessage.to_dict(), 'status': 'updated'}
					self.response.out.write(json.dumps(response, default=self.date_time_handler))
				else:
					existingMessage.key.delete()
					response = {'status': 'deleted'}
					self.response.out.write(json.dumps(response))
			else:
				response = {'error': 'error finding message'}
				self.response.out.write(json.dumps(response))
		else:
			if 'google_plus_id' in postBody and 'comment' in postBody:
				try:
					newMessage = Message(google_plus_id = postBody['google_plus_id'],
						comment = postBody['comment'])
					newMessage.put()
					response = {'messages': newMessage.to_dict(), 'status': 'created'}
					self.response.out.write(json.dumps(response, default=self.date_time_handler))
				except:
					response = {'error': 'unable to create message with these values'}
					self.response.out.write(json.dumps(response))	
			else:
				response = {'error': 'missing required google_plus_id or comment field'}
				self.response.out.write(json.dumps(response))

app = webapp2.WSGIApplication([('/', MainHandler)], debug=True)
