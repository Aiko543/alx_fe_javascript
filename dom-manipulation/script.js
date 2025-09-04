// Initial quotes array
let quotes = [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don't let yesterday take up too much of today.", category: "Inspiration" },
    { text: "It's not whether you get knocked down, it's whether you get up.", category: "Resilience" }
];

const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');

// Function to display a random quote
function showRandomQuote() {
    if (quotes.length === 0) {
        quoteDisplay.innerHTML = "<P>No quotes available. Please add a new quote.</P>";
        return;
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    quoteDisplay.innerHTML = 
        `<p>"${quote.text}"</p>
        <p><em>- ${quote.category}</em></p>`;
}

// Add quote function
function addQuote() {
    const textInput = document.getElementById('newQuoteText');
    const categoryInput = document.getElementById('newQuoteCategory');

    const newText = textInput.value.trim();
    const newCategory = categoryInput.value.trim();

    if (newText == "" || newCategory == "") {
        alert("Please fill in both fields.");
        return;
    }

    // Add new quote to the array
    quotes.push({ text: newText, category: newCategory });

    // Clear input fields
    textInput.value = "";
    categoryInput.value = "";

    alert("Quote added successfully!");
}

// Event listeners
newQuoteBtn.addEventListener('click', showRandomQuote);

// Show an initial quote
showRandomQuote();

