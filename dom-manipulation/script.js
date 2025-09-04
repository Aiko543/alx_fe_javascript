// Initial quotes array (load from localStorage if available)
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
    { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
    { text: "Don't let yesterday take up too much of today.", category: "Inspiration" },
    { text: "It's not whether you get knocked down, it's whether you get up.", category: "Resilience" }
];

const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const categoryFilter = document.getElementById('categoryFilter');

// Save quotes to localStorage
function saveQuotes() {
    localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Function to display a random quote (filtered if needed)
function showRandomQuote() {
    let selectedCategory = categoryFilter.value;
    let filteredQuotes = selectedCategory === "all" 
        ? quotes 
        : quotes.filter(q => q.category === selectedCategory);

    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
        return;
    }

    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    quoteDisplay.innerHTML = 
        `<p>"${quote.text}"</p>
        <p><em>- ${quote.category}</em></p>`;

    // Save last viewed quote to sessionStorage
    sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

// Add new quote
function addQuote() {
    const textInput = document.getElementById('newQuoteText');
    const categoryInput = document.getElementById('newQuoteCategory');

    const newText = textInput.value.trim();
    const newCategory = categoryInput.value.trim();

    if (newText === "" || newCategory === "") {
        alert("Please fill in both fields.");
        return;
    }

    quotes.push({ text: newText, category: newCategory });
    saveQuotes();
    populateCategories();

    textInput.value = "";
    categoryInput.value = "";

    alert("Quote added successfully!");
}

// Populate category filter dropdown dynamically
function populateCategories() {
    // Clear existing options (keep "All Categories")
    categoryFilter.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All Categories";
    categoryFilter.appendChild(allOption);

    // Get unique categories
    const categories = [...new Set(quotes.map(q => q.category))];
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option); // ✅ appendChild used here
    });

    // Restore last selected filter
    const savedFilter = localStorage.getItem("selectedCategory");
    if (savedFilter) {
        categoryFilter.value = savedFilter;
    }
}

// Filter quotes when category changes
function filterQuotes() {
    localStorage.setItem("selectedCategory", categoryFilter.value);
    showRandomQuote();
}

// JSON Export
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

// JSON Import
function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        const importedQuotes = JSON.parse(e.target.result);
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert('Quotes imported successfully!');
    };
    fileReader.readAsText(event.target.files[0]);
}

// Event listeners
newQuoteBtn.addEventListener('click', showRandomQuote);

// Initialize
populateCategories();
showRandomQuote();
