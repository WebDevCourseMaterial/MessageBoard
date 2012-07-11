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
	# created_date_time = ndb.DateTimeProperty(auto_now_add=True)
	# 
	# @classmethod
	# def query_messages(cls):
	# 	return cls.query().order(-cls.created_data_time)

class MainHandler(webapp2.RequestHandler):
	def get(self):
		self.response.headers['Content-Type'] = 'text/plain'
		self.response.headers.add_header("Access-Control-Allow-Origin", "*")
		# messages = []
		# First test with simple dictionaries - Works
		# now = datetime.datetime.now()
		# now += datetime.timedelta(0, 0, 0, 0, 0, -4);  # Hardcode for EST
		# msg1 = {"google_plus_id": 108456725833219286408, "comment": "This is a post by Dave Fisher", "post_time": str(now)}
		# msg2 = {"google_plus_id": 106027280718489289045, "comment": "This is a post by Kristy Fisher", "post_time": str(now)}
		# messages.append(msg1)
		# messages.append(msg2)
		
		# Now move to ndb Model objects and json dump those
		msg1 = Message(google_plus_id = '108456725833219286408',
						comment = 'This is a post by Dave Fisher')
		msg2 = Message(google_plus_id = '106027280718489289045',
						comment = 'This is a post by Kristy Fisher')
		# messages.append(msg1.to_dict())				
		# messages.append(msg2.to_dict())						
		msg1.put()
		msg2.put()
		
		messages = Message.query().fetch(10)
		
		messageList =[]
		for message in messages:
			messageList.append(message.to_dict())
		
		self.response.out.write(json.dumps(messageList))
	def post(self):
		newMessage = Message(google_plus_id = self.request.get('google_plus_id'),
								comment = self.request.get('comment'))
		newMessage.put()
		self.response.out.write('You added a comment.  Well done.')

app = webapp2.WSGIApplication([('/', MainHandler)],
                              debug=True)
