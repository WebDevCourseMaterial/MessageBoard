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
		messageList =[]
		messages = Message.query().order(-Message.created_date_time).fetch(10)		
		for message in messages:
			messageList.append(message.to_dict())
		self.response.out.write(json.dumps(messageList, default=self.date_time_handler))

	def date_time_handler(self, obj):
	    return obj.isoformat() if hasattr(obj, 'isoformat') else obj

	def post(self):
		postBody = json.loads(self.request.body)
		newMessage = Message(google_plus_id = postBody['google_plus_id'],
										comment = postBody['comment'])
		newMessage.put()
		self.response.headers['Content-Type'] = "text/plain"
		self.response.out.write(json.dumps(newMessage.to_dict(), default=self.date_time_handler))

app = webapp2.WSGIApplication([('/', MainHandler)], debug=True)
