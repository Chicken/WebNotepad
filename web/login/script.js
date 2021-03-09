let error = window.location.hash?.substr(1);
let box = document.getElementById("error");

switch(error) {

    case "invalid": {
        box.style.display = "inline-block";
        box.innerText = "Invalid username or password.";
        break;
    }

    case "error": {
        box.style.display = "inline-block";
        box.innerText = "Server error! Try again later.";
        break;
    }

}
