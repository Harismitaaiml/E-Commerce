import { initializeApp } from
"https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut
} from
"https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const form = document.getElementById("loginForm");
const message = document.getElementById("loginMessage");
const button = document.getElementById("loginBtn");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    message.textContent = "";
    button.disabled = true;
    button.textContent = "Verifying...";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const credential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        const token = await credential.user.getIdToken();

        // Ask backend to verify the admin role.
        const response = await fetch("https://e-commerce-zrdv.onrender.com/hobby-api/admin/verify", {
            headers: {
                "X-Firebase-Auth": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            await signOut(auth);
            throw new Error("This account does not have verified admin access.");
        }

        sessionStorage.setItem("adminToken", token);

        window.location.href = "./admin-dashboard.html";

    } catch (error) {
        message.textContent = error.message;
        button.disabled = false;
        button.textContent = "Login to Dashboard";
    }
});
