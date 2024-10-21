document.addEventListener('DOMContentLoaded', () => {
    // Token and Socket initialization for both Poll and Comments
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:3000', { auth: { token } });

    const pollId = getPollId();

    if (pollId) {
        // Fetch poll results when the pollId exists
        fetchPollResults(pollId);
    }

    // Real-time updates for poll votes
    socket.on('updateVotes', (poll) => {
        displayPollResults(poll);
    });

    // Real-time updates for new comments via WebSocket
    socket.on('newComment', (newComment) => {
        updateLocalComments(newComment);  // Update the in-memory comments
    });

    // Fetch comments for the poll
    fetchComments(pollId);

    // Submit new comment via socket
    document.getElementById('submitComment').addEventListener('click', () => {
        const commentText = document.getElementById('newComment').value;
        const parentCommentId = null; // Set to null for top-level comments

        // Emit new comment directly to the server via WebSocket
        socket.emit('newComment', { pollId, comment: commentText, parentCommentId });

        // Clear the input field after submission
        document.getElementById('newComment').value = '';
    });

    //POLL-RELATED FUNCTIONS
    function getPollId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('pollId');
    }

    async function fetchPollResults(pollId) {
        try {
            const response = await axios.get(`http://localhost:3000/poll/${pollId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const poll = response.data;
            displayPollResults(poll);
        } catch (error) {
            console.error('Error fetching poll results:', error);
        }
    }

    function displayPollResults(poll) {
        const pollQuestionElement = document.getElementById('pollQuestion');
        const pollResultsElement = document.getElementById('pollResults');

        pollQuestionElement.textContent = poll.question;

        pollResultsElement.innerHTML = `
            <h5>Results:</h5>
            <ul class="list-group">
                ${poll.options.map(option => `
                    <li class="list-group-item">
                        ${option}: ${poll.votes[option] || 0} vote(s)
                    </li>
                `).join('')}
            </ul>
        `;
    }

    //COMMENTS-RELATED FUNCTIONS
    let commentsData = [];  // Store fetched comments in-memory

    // Fetch comments for the current poll
    async function fetchComments(pollId) {
        try {
            const response = await axios.get(`http://localhost:3000/comments/allcomments/${pollId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            commentsData = response.data;
            console.log(commentsData);
            renderComments(commentsData);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }

    // Render comments and replies recursively
    function renderComments(comments, parentElement = document.getElementById('comments'), level = 0) {
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.style.marginLeft = `${level * 20}px`;
            commentElement.innerHTML = `
                <div>
                    <strong>${comment.userId}</strong>:
                    <p>${comment.comment}</p>
                    <button class="replyButton btn btn-link" data-comment-id="${comment._id}">Reply</button>
                </div>
            `;
            parentElement.appendChild(commentElement);

            if (comment.replies && comment.replies.length > 0) {
                renderComments(comment.replies, commentElement, level + 1);
            }
        });

        // Attach event listeners to reply buttons
        document.querySelectorAll('.replyButton').forEach(button => {
            button.addEventListener('click', handleReplyClick);
        });
    }

    function handleReplyClick(event) {
        const parentCommentId = event.target.getAttribute('data-comment-id');
        const replyTextarea = document.createElement('textarea');
        replyTextarea.className = 'form-control mt-2 replyInput';
        replyTextarea.placeholder = 'Add a reply...';

        const submitReplyButton = document.createElement('button');
        submitReplyButton.className = 'btn btn-primary mt-2';
        submitReplyButton.textContent = 'Submit Reply';

        // On reply button click, emit the reply
        submitReplyButton.onclick = () => {
            const replyText = replyTextarea.value;
            if (replyText.trim() !== '') {
                socket.emit('newComment', { pollId, comment: replyText, parentCommentId });

                // Clear the input field after submission
                replyTextarea.value = '';

                // Optionally, remove the textarea and button after submission
                replyTextarea.remove();
                submitReplyButton.remove();
            } else {
                alert('Please enter a reply before submitting.'); // Optional: Alert if the reply is empty
            }
        };

        // Append the textarea and button to the comment
        const commentContainer = event.target.parentNode;
        commentContainer.appendChild(replyTextarea);
        commentContainer.appendChild(submitReplyButton);
    }

    // Update local comments in-memory and re-render only the affected part
    function updateLocalComments(newComment) {
        if (newComment.parentCommentId) {
            addReplyToParent(commentsData, newComment);
        } else {
            commentsData.push(newComment);
        }

        document.getElementById('comments').innerHTML = '';
        renderComments(commentsData);
    }

    // Helper to find parent comment and add reply
    function addReplyToParent(comments, newReply) {
        comments.forEach(comment => {
            if (comment._id === newReply.parentCommentId) {
                if (!comment.replies) comment.replies = []; // Initialize replies if not present
                comment.replies.push(newReply);
            } else if (comment.replies && comment.replies.length > 0) {
                addReplyToParent(comment.replies, newReply);
            }
        });
    }
});
