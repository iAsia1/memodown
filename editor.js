// Gets the browser storage
const STORAGE_KEY = "notesDB";

const textbox = document.getElementById("edit-pane")    // Get editor
const preview = document.getElementById("preview-pane") // Get preview

// Getting elements for loading the note's data
const header = document.querySelector(".header");        // Title
const date = document.querySelector(".top-editor span"); // Last modified date

// === Note Loading
// Get note ID from URL
const params = new URLSearchParams(window.location.search);
const noteId = params.get("id");

let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentNote = notes.find(n => n.id === noteId);

// Fill the contents of the editor with the note's data
if (currentNote) {
    header.innerHTML = `<i class="fa-solid fa-pen-to-square fa-xs"></i> ${currentNote.title}`;
    textbox.value = currentNote.content || "";
    date.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${new Date(currentNote.modified).toLocaleString()}`;
// Fallback if the user goes into the editor without note data
} else {
    header.textContent = "Note not found"; // Header text

    // Getting rid of everything else other than the header
    textbox.style = "display:none;";
    preview.style = "display:none;";
    date.style = "display:none;";

    const moredropdown = document.querySelector(".top-editor .dropdown");
    moredropdown.style = "display:none;";
    const topbar = document.querySelector(".top-bar");
    topbar.style = "display:none;"

    save.disabled = true; // Disables saving functionality
}

// === Note Data Functions
// Saving Function
// (saves the title, content, and date of the current note when the save button is pressed)
const save = document.getElementById("saveBtn"); // Get save button
save.addEventListener("click", () => { // When clicked...
    if (!currentNote) return;

    currentNote.title = header.textContent.trim() || "Untitled Note"; // Get title of the note
    currentNote.content = textbox.value;                              // Get content
    currentNote.modified = Date.now();                                // Get last modified date (which is when the button was pressed)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); // Save this in the notesDB database for the note we're currently in

    date.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${new Date(currentNote.modified).toLocaleString()}</i>`; // Refresh last modified date
});

// Edit Title Function
// (edits the title of the note)
header.addEventListener("click", () => { // When the header is clicked...
    // Create a new input element
    const input = document.createElement("input");
    input.id = "note-title-form"     // ID (for styling)
    input.type = "text";             // Input type
    input.value = currentNote.title; // Value of the form (which is the note title)

    header.replaceWith(input); // Switch out header with the input element
    input.focus();             // Instantly focus

    // When submitted...
    input.addEventListener("blur", () => { // Through clicking off:
        currentNote.title = input.value.trim() || "Untitled Note";  // Make the value of the input our note title
        input.replaceWith(header);                                  // Switch back to the header element
        header.innerHTML = `<i class="fa-solid fa-pen-to-square fa-xs"></i> ${currentNote.title}`; // Format back header element

        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); // Instantly save to the notesDB database
    });

    input.addEventListener("keydown", (e) => { // or through pressing enter:
        if (e.key === "Enter") input.blur(); // Do the same thing as above
    });
});

// Export as MD Button
const exportBtn = document.getElementById("exportBtn"); // Get export button
exportBtn.addEventListener("click", () => { // When clicked...
    const note = notes.find(n => n.id === noteId); // Get current note
    if (!note) return;

    const md = `${note.content}`; // Contents of the file
    // Template for adding the note's metadata into the file's text: https://rentry.co/e74gx9nq

    // Create a blob URL to that file
    const blob = new Blob([md], { type: "text/markdown" }); 
    const url = URL.createObjectURL(blob);

    // Makes an <a> element
    const a = document.createElement("a");
    a.href = url; // Links to the URL we made
    a.download = `${note.title || "Untitled Note"}.md`; // Makes the file name
    document.body.appendChild(a);                       // Puts the element into the document

    // Clicks the <a> element, downloading the file
    a.click();

    document.body.removeChild(a); // Removes <a> element
    URL.revokeObjectURL(url);     // Deletes blob URL
});

// Export as HTML Button
const exportHtmlBtn = document.getElementById("exportHtmlBtn") // Get export button
exportHtmlBtn.addEventListener("click", () => { // When clicked...
    const note = notes.find(n => n.id === noteId); // Get current note
    if (!note) return;

    // Make up the contents of the file
    const html = `
    <!DOCTYPE html>
    <html>
        <head>
            <title>${note.title}</title>
            <style>
                body { 
                    padding: 1em 10em; 
                    font-family: Segoe UI, Tahoma, sans-serif; 
                    }
                @media screen and (max-width: 900px) {
                    body {
                        padding: 1em;
                    }
                }

                img {
                    width: 50%;
                    height: 50%;
                }
                </style>
        </head>
        <body>${preview.innerHTML}</body>
    </html>
    `

    // Create a new blob URL
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // Makes an <a> element
    const a = document.createElement("a");
    a.href = url;                                         // Links to the blob URL we made
    a.download = `${note.title || "Untitled Note"}.html`; // Makes the file name
    document.body.appendChild(a);                         // Puts the element into the document

    // Clicks the <a> element, downloading the file
    a.click();

    document.body.removeChild(a); // Removes <a> element
    URL.revokeObjectURL(url);     // Deletes blob URL
})

// Delete Note Function
const deleteInput = document.getElementById("delete-title");       // Gets form input
const deleteForm = document.querySelector("#deleteDropdown form"); // Gets form
deleteForm.addEventListener("submit", (e) => { // When submitted...
    e.preventDefault();                                              // Don't refresh
    if (deleteInput.value.trim().toLowerCase() !== "delete") return; // If the input isn't "delete", then return

    const index = notes.findIndex(n => n.id === noteId); // Gets the index # of the note in the database by matching it's ID
    if (index === -1) return;                            // If somehow the note doesn't exist in the database, then return

    notes.splice(index, 1); // Remove note from the database's array

    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); // Save database
    window.location.href = "index.html";                      // Go home
});


// === Insert Button Logic
// Wrap Function
// (Used by single-function "wrap" buttons, like Bold, Italics, Strikethrough, etc.)

textbox.addEventListener("input", renderPreview);
function wrapSelection(insert, wrap = "") { 
    const start = textbox.selectionStart;               // Get start of selection
    const end = textbox.selectionEnd;                   // Get end of selection
    const selected = textbox.value.slice(start, end)    // Make up the selection with both start and end

    textbox.value = textbox.value.slice(0, start) + insert + selected + wrap + textbox.value.slice(end);
    // Make the value of the textbox, now with the wrap around the selection

    textbox.selectionStart = start + insert.length
    textbox.selectionEnd = end + insert.length
    // Maintain selection

    textbox.focus(); // Focus on the editor so the wrap actually applies
    renderPreview(); // Render the preview once it applies
    }

// Insert Buttons
document.querySelectorAll("[data-insert]").forEach(btn => {     // For every button that has a wrap attribute...
    btn.addEventListener("mousedown", e => e.preventDefault()); // Don't reload the page
    btn.addEventListener("click", () => {
        wrapSelection(btn.dataset.insert, btn.dataset.wrap);    // When clicked, use the wrapSelection attribute with the values of your insert and wrap attributes
    });
});

// Insert Function
// (Used by insert forms, like the Link Form, Image Form, Video Form, etc.)
function insertAtCursor(markdown, selectOffset = markdown.length) {
    const start = textbox.selectionStart; // Get start of selection
    const end = textbox.selectionEnd;     // Get end of selection

    textbox.value = textbox.value.slice(0, start) + markdown + textbox.value.slice(end);
    // Make the value of the textbox, now with the inserted markdown

    textbox.selectionStart = textbox.selectionEnd = start + selectOffset;
    // Make the selection go to the left of the markdown insert

    textbox.focus(); // Focus on the editor so the insert actually applies
    renderPreview(); // Render the preview once it applies
}

// Links going to a new tab
// (Don't know where to put this though)
document.querySelectorAll("a").forEach(link => {    // For every link...
  link.setAttribute("target", "_blank");            // Open up to a new tab
  link.setAttribute("rel", "noopener noreferrer");  // Don't let sites access window.opener + Hide the source of the click to the new site
});

// === Dropdowns
// Dropdown Logic
function toggleDropdown(id) { // This function is used by dropdown buttons, for when its clicked it...
    document.getElementById(id).classList.toggle("show"); // Toggles the dropdown by applying/removing the .show class to the dropdown
}

window.onclick = function(e) { // This function is used when the user clicks off the dropdown
    if (!e.target.closest('#headerDropdownBtn, #listDropdownBtn, #linkBtn, #linkDropdown, #imgBtn, #imgDropdown, #vidBtn, #vidDropdown, #alignDropdownBtn, #colorsDropdownBtn, #colorDropdown, #moreBtn, #moreDropdown, #deleteBtn, #deleteDropdown')) { // If the user clicks off any of these elements
    var dropdown = document.querySelectorAll('#headerDropdown, #listDropdown, #linkDropdown, #imgDropdown, #vidDropdown, #alignDropdown, #colorDropdown, #moreDropdown, #deleteDropdown')
        .forEach(dropdown => dropdown.classList.remove('show')); // Then remove the .show class to their respective dropdowns
    }
}

// Color Form
// (Form for wrapping text around color syntax)
const colorForm = document.querySelector('#colorDropdown form'); // Get the color dropdown form
colorForm.addEventListener('submit', function (e) { // When submitted...
    e.preventDefault(); // Don't refresh

    const code = document.getElementById('color-code').value.trim(); // Get the hex code by using the color picker value
    if (!code) return; // If somehow there isn't a hex code, then return

    wrapSelection(`%${code}%`, "%%"); // Wrap the text around these, which includes the hex code

    // Optional cleanup
    colorForm.reset(); // Resets form
    document.getElementById("colorDropdown").classList.remove("show"); // Closes dropdown if it wasn't already
    renderPreview(); // Render the preview once it applies
});            

// Color Transfer function
// (Makes it so whatever is in the text field applies to the color picker value and vice versa)
const picker = document.getElementById("color-code"); // Gets color picker
const text = document.getElementById("color-text");   // Gets color field
// Color picker value -> Text field value
picker.addEventListener("input", () => {
    text.value = picker.value;
});
// Text field value -> Color picker value
text.addEventListener("input", () => {
if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(text.value)) { // Outputs only a hex code
    picker.value = text.value;
}
});

// Link Form
// (Form for creating links using MD's link syntax)
const linkForm = document.querySelector('#linkDropdown form'); // Gets the link dropdown form
linkForm.addEventListener('submit', function (e) { // When submitted...
    e.preventDefault(); // Don't refresh

    const url  = document.getElementById('link-url').value.trim();  // Get the URL field
    const text = document.getElementById('link-text').value.trim(); // Get the link label field

    if (!text && !url) return; // If somehow there aren't both, then return

    insertAtCursor(`[${text}](${url})`); // Insert the link at cursor

    // Optional cleanup
    linkForm.reset(); // Reset the form
    document.getElementById("linkDropdown").classList.remove("show"); // Closes dropdown if it wasn't already
});

// Image Form
// (Form for creating images using MD's image syntax)
const imgForm = document.querySelector('#imgDropdown #imgform'); // Gets the image dropdown form (futureproofing for when I add an imagehost feature)
imgForm.addEventListener('submit', function (e) { // When submitted...
    e.preventDefault(); // Don't refresh

    const url = document.getElementById('img-url').value.trim(); // Get image URL field
    const alt = document.getElementById('img-alt').value.trim(); // Get alt text field

    if (!url) return; // If there isn't an image URL, then return

    insertAtCursor(`![${alt}](${url})`); // Insert the image link at cursor

    // Optional cleanup
    imgForm.reset(); // Reset the form
    document.getElementById("imgDropdown").classList.remove("show"); // Closes dropdown if it wasn't already
});

// Video Form
// (Form for creating YouTube video "embeds" using MD's image and link syntax)
const vidForm = document.querySelector('#vidDropdown form'); // Gets the video dropdown form
vidForm.addEventListener('submit', function (e) { // When submitted...
    e.preventDefault(); // Don't refresh

    const url = document.getElementById('yt-url').value.trim(); // Get the YouTube URL
    const result = parseYTLink(url)                             // Send the URL parsing to a different function

    // Now since the URL is done parsing...
    const link =  result.cleanUrl   // Get the clean URL (which is just the YT URL without tracking parameters)
    const thumb =  result.thumbnail // Get the thumbnail URL

    if (!url) return;   // If there isn't a YT URL, then return

    insertAtCursor(`[![](${thumb})](${link})`); // Insert this image + link hybrid at cursor

    // Optional cleanup
    vidForm.reset(); // Reset the form
    document.getElementById("vidDropdown").classList.remove("show"); // Closes dropdown if it wasn't already
});

// Parse YouTube Links function
// (Function that gives the video form a clean YT link and thumbnail)
function parseYTLink(url) {
    try { // If there is input, then...
        const u = new URL(url); // Gets URL
        let id = "";

        // Gets the ID of these links... (by splitting content to the left of the ID)
        // youtu.be/ID
        if (u.hostname === "youtu.be") {
            id = u.pathname.slice(1);
        }

        // youtube.com URLs
        else if (u.hostname.includes("youtube.com")) {
            // watch?v=ID
            if (u.searchParams.get("v")) {
                id = u.searchParams.get("v");
            }
            // shorts/ID
            else if (u.pathname.startsWith("/shorts/")) {
                id = u.pathname.split("/shorts/")[1];
            }
            // embed/ID
            else if (u.pathname.startsWith("/embed/")) {
                id = u.pathname.split("/embed/")[1];
            }
        }

        if (!id) return null; // If there's no ID somehow, then return with nothing
        id = id.split("?")[0]; // Splits off any paramaters to the right

        // Make up the links again
        const cleanUrl = `https://www.youtube.com/watch?v=${id}`;           // YouTube link (w/o tracking paramaters, thus "clean")
        const thumbnail = `https://img.youtube.com/vi/${id}/mqdefault.jpg`; // YouTube thumbnail (medium size)
        
        return { cleanUrl, thumbnail }; // Return with the contents of those variables
    } 
    catch { // If there isn't input then... 
        return null; // Return with nothing
    }
}

// Left Align Button
// (Pretty much a universal function on it's own for removing syntax, but the only use I've found for it was the left-align button)
function removeArrows() {
    const start = textbox.selectionStart; // Get start of selection
    const end = textbox.selectionEnd;     // Get end of selection

    if (start === end) return; // If there isn't a selection then return

    let selectedText = textbox.value.slice(start, end); // Make up the selection with both the start and end

    // Replace the arrow syntax for center-alignment / right-alignment with nothing in the selection
    // (aka get rid of the arrows in selection)
    selectedText = selectedText.replace(/->|<-|->/g, '');

    // Put together the value of the textbox now with the syntax removed from the selection
    textbox.value = textbox.value.slice(0, start) + selectedText + textbox.value.slice(end);

    // Put the selection on the "clean" text
    textbox.selectionStart = start;
    textbox.selectionEnd = start + selectedText.length;

    textbox.focus(); // Focus on the textbox so it actually applies
    renderPreview(); // Render the preview once it applies
}

// === Markdown Parser
// Marked Extensions
// Underlines
const underlineExt = {
    // Basic extension metadata
    name: 'underline',
    level: 'inline',
    // Activate when it detects "==" in the textbox
    start(src) {
        return src.indexOf('==');
    },
    // If the text has this syntax then turn it into a token
    // (in which the renderer will interpret the output the token gives to actually render the text with formatting)
    tokenizer(src) {
        const match = /^==([^=]+)==/.exec(src); // Text should fall under this regex, outputting out an array for return to categorize
        if (!match) return; // Return if there isn't a match

        return { // Output out from match's array:
                type: 'underline', // The token name called "underline"
                raw: match[0],     // Raw content
                text: match[1]     // Text value w/o syntax
        };
    },
    // Render the HTML based on what the tokenizer outputs
    renderer(token) {
        return `<u>${marked.parseInline(token.text)}</u>`;
        // Put the text under <u> tags
    }
    };

// Colored Text
const colorExt = {
    // Basic Metadata
    name: 'color',
    level: 'inline',
    // Activate when it detects "%" in the textbox
    start(src) {
        return src.indexOf('%');
    },
    // If the text has this syntax then turn it into a token
    // (in which the renderer will interpret the output the token gives to actually render the text with formatting) 
    tokenizer(src) {
        const match = /^%([^%]+)%([\s\S]+?)%%/.exec(src); // Text should fall under this regex
        if (!match) return; // Return if there isn't a match

        return { // Output out:
            type: 'color',      // Token name
            raw: match[0],      // Raw content
            color: match[1],    // Color value w/o syntax
            text: match[2]      // Text value w/o syntax
        };
    },
    // Render the HTML based on what the tokenizer outputs
    renderer(token) {
        return `<span style="color:${token.color}">${marked.parseInline(token.text)}</span>`;
        // Put the text under <span> tags, with a color style attribute
    }
    };

// Right Aligned
const rightExt = {
    // Basic metadata
    name: 'right',
    level: 'inline',
    // Activate when it detects "->"
    start(src) {
        return src.indexOf('->');
    },
    // Tokenizes text under this syntax
    tokenizer(src) {
        const match = /^->\s*([\s\S]+?)\s*->/.exec(src); // Should fall under this regex
        if (!match) return;

        return { // Output:
            type: 'right',  // Token name
            raw: match[0],  // Raw content
            text: match[1]  // Text w/o syntax
        };
    },
    // Renders HTML from what the tokenizer outputs
    renderer(token) {
        return `<span style="display:block;text-align:right;">${marked.parseInline(token.text)}</span>`;
        // Put the text under <span> tags, with a right-alignment attribute
    }
    };

// Center Aligned
const middleExt = {
    // Basic metadata
    name: 'middle',
    level: 'inline',
    // Activate when it detects "->"
    start(src) {
        return src.indexOf('->');
    },
    // Tokenizes text under syntax
    tokenizer(src) {
        const match = /^->\s*([\s\S]+?)\s*<-/.exec(src); // Should fall under this regex
        if (!match) return;

        return {    // Output
        type: 'middle',     // Name
        raw: match[0],      // Raw content
        text: match[1]      // Text w/o syntax
        };
    },
    // Renders HTML from what the tokenizer outputs
    renderer(token) {
        return `<span style="display:block;text-align:center;">${marked.parseInline(token.text)}</span>`;
        // Put the text under <span> tags, with a center-alignment attribute
    }
    };

// Extension Config
// Use custom extensions:
marked.use({ extensions: [underlineExt, colorExt, rightExt, middleExt] }); 

// Use imported extensions:
marked.use(
    window.markedAlert?.()
);

// Marked Options:
marked.setOptions({
    gfm: true,      // Use GitHub Flavored Markdown
    breaks: true    // Automatically break per line
    });

// Render Preview
function renderPreview() {
    // Parses the MD, then 
    preview.innerHTML = DOMPurify.sanitize(marked.parse(textbox.value));

    // Use a syntax highlighter for codeblocks
    preview.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    }

// Always run this function if it wasn't already
renderPreview();
textbox.addEventListener('input', renderPreview);

// Code Dump 1 - Rotating header button
// https://rentry.co/i2p9u68u