// Establish socket connection
//const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MTRjNGI4ZWYzYzNmODE1ZjJkY2YwZSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTcyOTQzMzk1NSwiZXhwIjoxNzI5NDUxOTU1fQ.rqNQrGQD02nuh-Bfh0vchRxL-apY995HrhM1xw8pJRU'; // Replace with actual token
const token=localStorage.getItem('token');
console.log("this is token", token);
const socket = io('http://localhost:3000', {
    auth: {
        token: token
    }
});

socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

// Function to fetch all polls
async function fetchPolls() {
    try {
        //const response = await axios.get('http://localhost:3000/poll/getallpolls');

        const response = await axios.get('http://localhost:3000/poll/getallpolls', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const polls = response.data.polls;
        displayPolls(polls);
    } catch (error) {
        console.error('Error fetching polls:', error);
        alert('There was an error fetching polls.');
    }
}

function displayPolls(polls) {
    const pollsContainer = document.getElementById('pollsContainer');
    pollsContainer.innerHTML = ''; // Clear previous polls

    polls.forEach(poll => {
        const pollCard = document.createElement('div');
        pollCard.className = 'col-md-4 mb-4';
        pollCard.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${poll.question}</h5>
                    <p class="card-text">Options:</p>
                    <form id="pollForm-${poll._id}">
                        <ul class="list-group list-group-flush">
                            ${poll.options.map((option, index) => `
                                <li class="list-group-item">
                                    <input type="radio" name="option" value="${option}" id="option-${poll._id}-${index}" />
                                    <label for="option-${poll._id}-${index}">${option}</label>
                                </li>`).join('')}
                        </ul>
                    </form>
                    <div id="voteSection-${poll._id}">
                        ${poll.hasVoted 
                            ? `<p class="text-success">You have already participated!</p>` 
                            : `<button class="btn btn-primary mt-2" onclick="vote('${poll._id}')">Vote</button>`
                        }
                    </div>
                    <button class="btn btn-secondary mt-2" onclick="viewResults('${poll._id}')">View Results</button>
                </div>
            </div>
        `;
        pollsContainer.appendChild(pollCard);
    });
}

// Function to handle voting
function vote(pollId) {
    const selectedOption = document.querySelector(`input[name="option"]:checked`);

    if (!selectedOption) {
        alert("Please select an option before voting.");
        return;
    }

    const optionValue = selectedOption.value;

    console.log('pollid: '+pollId);
    console.log('option: '+optionValue);

    // Emit the vote through socket
    socket.emit('vote', { pollId, option: optionValue });

    // Handle successful vote
    socket.on('newVote', function(data) {
        alert(data.message);
        console.log(data.message);
        // Update UI to reflect the user's participation
        document.getElementById(`voteSection-${pollId}`).innerHTML = '<p class="text-success">Thank you for voting!</p>';
    });

    // Handle vote error
    socket.on('voteError', function(data) {
        alert(data.message);
    });
}

// Function to redirect to the results page
function viewResults(pollId) {
    window.location.href = `pollResults.html?pollId=${pollId}`; // Redirect with poll ID as a query parameter
}

// Fetch polls when the page loads
fetchPolls();