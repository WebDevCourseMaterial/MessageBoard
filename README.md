<h1>XMLHttpRequests</h1>
The goal of this project is to learn about making XHR requests.

The backend for this project lives at http://rose-message-board.appspot.com.

The backend stores messages.  A message consist of 4 parts:
 - message_id        Unique id of this message
 - google_plus_id    Id of the person that posted this message (easy to fake a sender)
 - comment           The message body
 - created_date_time When the message was posted

Using the backend you can create a message and add it to the datastore, get the messages, 
edit a message, and delete a message (standard CRUD).

<b>Getting messages</b>
Get 10 results:  GET request to rose-message-board.appspot.com
Get 12 results:  GET request to rose-message-board.appspot.com?limit=12
Get 22 results:  GET request to rose-message-board.appspot.com?limit=20&offset=0  then...
                 GET request to rose-message-board.appspot.com?limit=20&offset=20

<b>Creating, editing, and deleting a message</b>
Create a new message: POST request to rose-message-board.appspot.com
                      with a POST body {"google_plus_id": "12345", "comment": "Hello Dave"}
(returns the message that was created, 'status': 'created')

Edit a new message:   POST request to rose-message-board.appspot.com
                      with a POST body with a message id and field to edit {"message_id": 15, "comment": "Hello David"}
(returns the message that was edited, 'status': 'updated')

Delete a new message: POST request to rose-message-board.appspot.com
                      with a POST body with only the message id {"message_id": 15}
(returns 'status': 'deleted')