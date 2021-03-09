let error = window.location.hash?.substr(1);
let box = document.getElementById("error");

switch(error) {

    case "invalid": {
        box.style.display = "inline-block";
        box.innerText = "Invalid username";
        break;
    }

    case "exists": {
        box.style.display = "inline-block";
        box.innerText = "User already exists";
        break;
    }

    case "repeat": {
        box.style.display = "inline-block";
        box.innerText =
            "Repeated password is not the same as original password";
        break;
    }

    case "error": {
        box.style.display = "inline-block";
        box.innerText = "Server error! Try again later.";
        break;
    }

}
