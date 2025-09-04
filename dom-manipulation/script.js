// --- Quotes Array (loaded from localStorage if available) ---
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don't let yesterday take up too much of today.", category: "Inspiration" },
    { text: "It's not whether you get knocked down, it's whether you get up.", category: "Resilience" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");

// --- Save quotes to localStorage ---
function saveQuotes() {
    localStorage.setItem("quotes", JSON.stringify(quotes));
}

// --- Function to display a random quote ---
function showRandomQuote() {
    if (quotes.length === 0) {
        quoteDisplay.innerHTML = "<p>No quotes available. Please add a new quote.</p>";
        return;
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];

    quoteDisplay.innerHTML = `
        <p>"${quote.text}"</p>
        <p><em>- ${quote.category}</em></p>
    `;

    // Save last viewed quote to sessionStorage
    sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

// --- Function to dynamically create the Add Quote form ---


// --- Add new quote ---
function addQuote() {
    const textInput = document.getElementById("newQuoteText");
    const categoryInput = document.getElementById("newQuoteCategory");

    const newText = textInput.value.trim();
    const newCategory = categoryInput.value.trim();

    if (newText === "" || newCategory === "") {
        alert("Please fill in both fields.");
        return;
    }

    quotes.push({ text: newText, category: newCategory });
    saveQuotes();

    textInput.value = "";
    categoryInput.value = "";

    alert("Quote added successfully!");
}

// --- Export quotes as JSON ---
function exportToJsonFile() {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    a.click();

    URL.revokeObjectURL(url);
}

// --- Import quotes from JSON file ---
function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function (event) {
        try {
            const importedQuotes = JSON.parse(event.target.result);

            if (Array.isArray(importedQuotes)) {
                quotes.push(...importedQuotes);
                saveQuotes();
                alert("Quotes imported successfully!");
            } else {
                alert("Invalid JSON format.");
            }
        } catch (err) {
            alert("Error parsing JSON file.");
        }
    };
    fileReader.readAsText(event.target.files[0]);
}

// --- Event listeners ---
newQuoteBtn.addEventListener("click", showRandomQuote);

// --- On Load: Show last viewed quote from sessionStorage if available ---
const lastQuote = JSON.parse(sessionStorage.getItem("lastQuote"));
if (lastQuote) {
    quoteDisplay.innerHTML = `
        <p>"${lastQuote.text}"</p>
        <p><em>- ${lastQuote.category}</em></p>
    `;
} else {
    showRandomQuote();
}

// --- Create form dynamically ---
createAddQuoteForm();
