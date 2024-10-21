// Function to validate inputs
function validateInputs(question, options) {
    return question && options.length >= 2;
}

// Function to create a poll
async function createPoll(question, options) {
    //const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MTRjNGI4ZWYzYzNmODE1ZjJkY2YwZSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTcyOTQzMzk1NSwiZXhwIjoxNzI5NDUxOTU1fQ.rqNQrGQD02nuh-Bfh0vchRxL-apY995HrhM1xw8pJRU'; // Replace with actual token
    const token=localStorage.getItem('token');
    try {
        const response = await axios.post('http://localhost:3000/poll/create', {
            question: question,
            options: options
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 201) {
            alert('Poll created successfully!');
            return true; // Indicates success
        }
    } catch (error) {
        console.error('Error creating poll:', error);
        alert('There was an error creating the poll.');
    }
    return false; // Indicates failure
}

// Event listener for form submission
document.getElementById('pollForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the form from refreshing the page
    
    // Get input values from the form
    const question = document.getElementById('question').value;
    const optionsInput = document.getElementById('options').value;

    // Split options by commas and remove leading/trailing whitespace
    const options = optionsInput.split(',').map(option => option.trim());

    // Validate inputs
    if (!validateInputs(question, options)) {
        alert('Please provide a valid question and at least two options.');
        return;
    }

    // Create the poll
    const success = await createPoll(question, options);

    // Clear the form fields if the poll was created successfully
    if (success) {
        document.getElementById('question').value = '';
        document.getElementById('options').value = '';
    }
});
