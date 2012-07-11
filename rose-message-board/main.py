#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import webapp2
import datetime
from google.appengine.ext import ndb
import json

class Message(ndb.Model):
	google_plus_id = ndb.StringProperty(required=True)
	comment = ndb.StringProperty(indexed=False, default='')
	created_date_time = ndb.DateTimeProperty(auto_now_add=True)

class MainHandler(webapp2.RequestHandler):
	def get(self):
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.headers.add_header("Access-Control-Allow-Origin", "*")
		# Add some messages to the database for testing
		msg1 = Message(google_plus_id = '108456725833219286408',
						comment = 'This is a post by Dave Fisher')
		msg2 = Message(google_plus_id = '106027280718489289045',
						comment = 'This is a post by Kristy Fisher')
		msg1.put()
		msg2.put()
		messageList =[]
		messages = Message.query().order(-Message.created_date_time).fetch(10)		
		for message in messages:
			messageList.append(message.to_dict())
		self.response.out.write(json.dumps(messageList, default=self.date_time_handler))

	def date_time_handler(self, obj):
	    return obj.isoformat() if hasattr(obj, 'isoformat') else obj

	def post(self):
		newMessage = Message(google_plus_id = self.request.get('google_plus_id'),
								comment = self.request.get('comment'))
		newMessage.put()
		self.response.out.write('You added a comment.  Well done.')

app = webapp2.WSGIApplication([('/', MainHandler)], debug=True)
