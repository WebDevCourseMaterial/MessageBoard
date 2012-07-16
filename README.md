<h1>XMLHttpRequests</h1>
The goal of this project is to learn about making XHR requests.

The backend for this project lives at http://rose-message-board.appspot.com.

The backend stores messages.  A message consist of 4 parts:
<table>
<tr><td>message_id</td><td>Unique id of this message</td>
<tr><td>google_plus_id</td><td>Id of the person that posted this message<br>(easy to fake a sender)</td>
<tr><td>comment</td><td>The message body</td>
<tr><td>created_date_time</td><td>When the message was posted</td>
</table>

Using the backend you can create a message and add it to the datastore, get the messages, 
edit a message, and delete a message (standard CRUD).

<h3>Getting messages</h3>
Get 10 results:  GET request to http://rose-message-board.appspot.com<br>
Get 12 results:  GET request to http://rose-message-board.appspot.com?limit=12<br>
Get 22 results:  GET request to http://rose-message-board.appspot.com?limit=20&offset=0  then...<br>
                 GET request to http://rose-message-board.appspot.com?limit=20&offset=20<br>
This will return a JSON objects that has a list of messages.
<br>
<h3>Creating a new message</h3>
POST request to http://rose-message-board.appspot.com<br>
with a POST body {"google_plus_id": "12345", "comment": "Hello Dave"}<br>
(returns the message that was created, 'status': 'created')<br>
Note that the message_id and created_date_time are not sent, but set by the backend<br>
<h3>Editing an existing message</h3>
POST request to http://rose-message-board.appspot.com<br>
with a POST body with a message id and field to edit {"message_id": 15, "comment": "Hello David"}<br>
(returns the message that was edited, 'status': 'updated')<br>
<h3>Deleting a message:</h3>
POST request to http://rose-message-board.appspot.com<br>
with a POST body with only the message id {"message_id": 15}
(returns 'status': 'deleted')