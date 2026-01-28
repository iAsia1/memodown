// load the file list in the home page
function loadList() {
    const list = document.getElementById("list"); // get the list element in HTML
    const files = JSON.parse(localStorage.getItem("mdFiles") || "{}"); // get list of files from local storage

    if (Object.keys(files).length === 0) {
        list.innerHTML += "<p>No files yet.</p>";
        return;
    }

    for (const name in files) {
      const div = document.createElement("div");
      div.textContent = name;

      div.onclick = () => {
        localStorage.setItem("currentFile", name);
        location.href = "editor.html";
      };

      list.appendChild(div);
    }
}

function getFiles() {
    try {
      return JSON.parse(localStorage.getItem("mdFiles")) || {};
    } 
    catch {
      // if storage is corrupted, reset
      localStorage.removeItem("mdFiles");
      return {};
    }
  }

  function saveFiles(files) {
    localStorage.setItem("mdFiles", JSON.stringify(files));
  }

function newFile() {
  let name = prompt("File name?");
  if (name === null) return;

  name = name.trim();
  if (!name) {
    alert("Invalid file name");
    return;
  }

  const files = getFiles();

  if (files[name]) {
    alert("File already exists");
    return;
  }

  files[name] = {
    content: "",                       // blank markdown content
    created: new Date().toISOString()  // store creation date
  };

  saveFiles(files);
  localStorage.setItem("currentFile", name);

  location.href = "editor.html";
  loadList;
}


  // Import a markdown file from disk
function importFile() {
    document.getElementById("fileInput").click();
}

document.getElementById("fileInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const files = JSON.parse(localStorage.getItem("mdFiles") || {});
      files[file.name] = reader.result;

      localStorage.setItem("mdFiles", JSON.stringify(files));
      localStorage.setItem("currentFile", file.name);

      location.href = "editor.html";
    };
    reader.readAsText(file);
    loadList;
  });

window.addEventListener("pageshow", loadList);