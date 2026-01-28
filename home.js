const listEl = document.getElementById("list");

const STORAGE_KEY = "notesDB";

// Storage functions
function loadNotes() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveNotes(notes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function sortNotes(notes) {
    return notes.sort((a, b) => b.modified - a.modified);
}

// Note Rendering
function renderNote(note) {
    const noteDiv = document.createElement("div");
    noteDiv.className = "note";

    // Template it follows
    noteDiv.innerHTML = `
        <div class="note-icon">
            <i class="fa-solid fa-file"></i>
        </div>
        <div class="note-details">
            <h3>${note.title}</h3>
            <p>${new Date(note.modified).toLocaleString()}</p>
        </div>
    `;

    noteDiv.addEventListener("click", () => {
        window.location.href = `editor.html?id=${note.id}`;
    });

    listEl.appendChild(noteDiv);
}

function renderAllNotes() {
    listEl.innerHTML = "";

    const notes = sortNotes(loadNotes());
    notes.forEach(renderNote);
}
renderAllNotes();

// New Note UI
const newBtn = document.getElementById("newBtn");
newBtn.addEventListener("click", () => { // When the New Note button is pressed...
    if (document.getElementById("new-note")) return;

    // Create a new <div> for the note creator
    const creator = document.createElement("div");
    creator.className = "note";
    creator.id = "new-note";

    // Contents of the note creator
    creator.innerHTML = `
        <div class="note-form">
            <input type="text" id="note-title" placeholder="Title" autocomplete="off">
            <button type="submit" id="note-submit"><i class="fa-solid fa-plus"></i></button>
        </div>
    `;

    listEl.prepend(creator); // Make it fit on the list

    document.getElementById("note-submit").addEventListener("click", () => { // When submitted...
        // Make up the title
        const titleInput = document.getElementById("note-title");
        const title = titleInput.value.trim() || "Untitled Note";

        const notes = loadNotes();

        // Make the rest of the note's data, such as the ID, content, and dates
        const newNote = {
            id: crypto.randomUUID(),
            title,
            content: "", 
            created: Date.now(),
            modified: Date.now()
        };

        // Save notes
        notes.unshift(newNote);
        saveNotes(notes);

        creator.remove(); // Remove creator
        renderAllNotes(); // Render notes again
    });
});

// Import Note UI
const importBtn = document.getElementById("importBtn");
importBtn.addEventListener("click", () => { // When clicked...
    if (document.getElementById("new-note")) return;

    // Create a new <div> for the note importer
    const importer = document.createElement("div");
    importer.className = "note";
    importer.id = "new-note";

    listEl.prepend(importer); // Make it fit on the list

    // Render the intial form + file importing functions
    renderImportChooser();
    function renderImportChooser() {
        // Initial form
        importer.innerHTML = `
            <div class="import-form">
                <input type="file" id="import-file" accept=".md,.txt" hidden>
                <button type="button" id="import-file-btn"><i class="fa-solid fa-file"></i> File</button>
                <button type="button" id="import-url-btn"><i class="fa-solid fa-link"></i> URL</button>
            </div>
        `;

        // File importing / interpreting
        const fileInput = importer.querySelector("#import-file");
        const fileBtn = importer.querySelector("#import-file-btn");

        fileBtn.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", () => {
            const file = fileInput.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                createImportedNote(
                    file.name.replace(/\.[^/.]+$/, ""),
                    reader.result
                );
            };
            reader.readAsText(file);
        });

        // Go to the import URL form when the URL button is clicked 
        const urlBtn = importer.querySelector("#import-url-btn");
        urlBtn.addEventListener("click", renderUrlForm);
    }

    // URL form + URL importing functions
    function renderUrlForm() {
        // URL form
        importer.innerHTML = `
            <div class="note-form">
                <input type="url" id="import-url-input" placeholder="URL">
                <button type="button" id="import-url-submit"><i class="fa-solid fa-plus"></i></button>
            </div>
        `;

        // URL Importing / Interpreting
        const input = importer.querySelector("#import-url-input");
        const submit = importer.querySelector("#import-url-submit");
        submit.addEventListener("click", async () => {
            const url = input.value.trim();
            if (!url) return;

            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error();

                const text = await res.text();
                const title =
                    url.split("/").pop()?.replace(/\.[^/.]+$/, "") ||
                    "Imported note";

                createImportedNote(title, text);
            } catch {
                alert("URL import failed");
            }
        });
    }
    

    // Note creator
    function createImportedNote(title, content) {
        const notes = loadNotes();

        notes.unshift({
            id: crypto.randomUUID(),
            title,
            content,
            created: Date.now(),
            modified: Date.now()
        });

        saveNotes(notes);
        importer.remove();
        renderAllNotes();
    }
});

const importJsonBtn = document.getElementById("importJsonBtn");
const importJsonFile = document.getElementById("importJsonFile");

importJsonBtn.addEventListener("click", () => { importJsonFile.click(); });
importJsonFile.addEventListener("change", () => {
    const file = importJsonFile.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const importedNotes = JSON.parse(reader.result);

            if (!Array.isArray(importedNotes)) {
                alert("Invalid JSON file");
                return;
            }

            localStorage.setItem("notesDB",JSON.stringify(importedNotes));

            location.reload(); // refresh UI
        } catch (err) {
            alert("Import failed");
        }
    };

    reader.readAsText(file);
    importJsonFile.value = "";
});

// Export JSON button
const exportJsonBtn = document.getElementById("exportJsonBtn");
exportJsonBtn.addEventListener("click", () => {
    const notes = localStorage.getItem("notesDB");
    if (!notes) return;

    const blob = new Blob([notes], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "memodown-save.json";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

function toggleDropdown(id) { // This function is used by dropdown buttons, for when its clicked it...
    document.getElementById(id).classList.toggle("show"); // Toggles the dropdown by applying/removing the .show class to the dropdown
}

window.onclick = function(e) { // This function is used when the user clicks off the dropdown
    if (!e.target.closest('#settingsBtn, #settingsDropdown, #deleteBtn, #deleteDropdown')) { // If the user clicks off any of these elements
    var dropdown = document.querySelectorAll('#settingsDropdown, #deleteDropdown')
        .forEach(dropdown => dropdown.classList.remove('show')); // Then remove the .show class to their respective dropdowns
    }
}

const deleteInput = document.getElementById("delete-title");       // Gets form input
const deleteForm = document.querySelector("#deleteDropdown form"); // Gets form
deleteForm.addEventListener("submit", (e) => { // When submitted...
    e.preventDefault();                                              // Don't refresh
    if (deleteInput.value.trim().toLowerCase() !== "delete") return; // If the input isn't "delete", then return

    localStorage.setItem(STORAGE_KEY, JSON.stringify([])); // Wipe everything from the database

    window.location.href = "index.html"; // Refresh
});