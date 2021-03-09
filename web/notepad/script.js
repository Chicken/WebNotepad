let container = document.getElementById("container");
let logoutBtn = document.getElementById("logout");
let newBtn = document.getElementById("new");
let welcomeText = document.getElementById("welcome");

logoutBtn.addEventListener("click", () => {
    window.location.href = "/logout";
});

newBtn.addEventListener("click", async () => {
    let { status, reason, note } = await (await fetch(
        window.location.href.split("/notepad")[0] + "/api/notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: "",
                content: ""
            })
        })).json();
    if(status != 201) {
        console.error(status, reason);
        return;
    } else {
        addNote(note);
    }
});

function formatDate(ms) {
    let date = new Date(ms);
    return date.toLocaleString();
}

function addNote({
    id, title, content, created, modified
}) {
    let node = document.createElement("div");
    node.classList.add("note");
    node.id = id + "-container";
    /* eslint-disable max-len */
    node.innerHTML =
    `<textarea rows="1" placeholder="Title" class="note-title" id="${id}-title">` +
    title         +
    "</textarea>" +
    `<div class="info" id="${id}-info">` +
    `Created: ${formatDate(created)}` +
    "<br>" +
    `Modified: ${formatDate(modified)}` +
    "</div>" +
    `<textarea placeholder="Content" class="note-content" id="${id}-content">` +
    content       +
    "</textarea>" +
    `<p class="save" id="${id}-save">Saved</p>` +
    `<button class="delete" id="${id}-deletebtn">Delete</button>`;
    /* eslint-enable max-len */
    container.appendChild(node);
    document.getElementById(`${id}-deletebtn`)
        .addEventListener("click", () => {
            deleteNote(id);
        });
    let saveStatus = document.getElementById(`${id}-save`);
    let saveTimeout;
    document.getElementById(`${id}-title`)
        .addEventListener("keyup", e => {
            e.target.value = e.target.value.replace(/[\n\r\t]/g, "");
            saveStatus.innerHTML = "Saving...";
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveNote, 1000, id);
        });
    let contentBox = document.getElementById(`${id}-content`);
    contentBox.rows = content.split("\n").length + 1;
    contentBox
        .addEventListener("keyup", () => {
            contentBox.rows = contentBox.value.split("\n").length + 1;
            saveStatus.innerHTML = "Saving...";
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveNote, 1000, id);
        });
}

async function saveNote(id) {
    let content = document.getElementById(`${id}-content`).value;
    let title = document.getElementById(`${id}-title`).value;
    let { status, reason, note: { created, modified } } = await (await fetch(
        window.location.href.split("/notepad")[0] + "/api/notes/" + id,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                content,
            })
        }
    )).json();
    let saveStatus = document.getElementById(`${id}-save`);
    if(status != 200) {
        console.error(status, reason);
        saveStatus.innerHTML = `Error: ${status}`;
    } else {
        saveStatus.innerHTML = "Saved";
        document.getElementById(`${id}-info`).innerHTML = 
        `Created: ${formatDate(created)}` +
        "<br>" +
        `Modified: ${formatDate(modified)}`;
    }
}

async function deleteNote(id) {
    let { status, reason } = await (await fetch(
        window.location.href.split("/notepad")[0] + "/api/notes/" + id,
        {
            method: "DELETE"
        }
    )).json();
    if(status != 200) {
        console.error(status, reason);
    } else {
        document.getElementById(`${id}-container`).remove();
    }
}

fetch(window.location.href.split("/notepad")[0] + "/api/notes")
    .then(res => res.json())
    .then(res => {
        welcomeText.innerHTML = `Welcome!<br>Logged in as "${res.user}"`;
        for(let note of Object.values(res.notes)) {
            addNote(note);
        }
    });
