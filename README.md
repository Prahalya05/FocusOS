FocusOS
A cross-platform productivity app for students to enhance focus, track goals, and support skill development and emotional wellness.
Setup Instructions

Clone the Repository:
git clone <repository-url>
cd FocusOS


Install Dependencies:
npm install


Configure Firebase:

Create a Firebase project at https://console.firebase.google.com/.
Enable Email/Password Authentication, Realtime Database, and Storage.
Replace the placeholders in src/firebase.js with your Firebase project credentials.
Set up Firebase security rules:{
    "rules": {
        "privateChannels": {
            "$uniqueId": {
                ".read": "auth != null && root.child('users').child(auth.uid).child('uniqueId').val() === $uniqueId || auth.email === 'your-email@example.com'",
                ".write": "auth != null && (root.child('users').child(auth.uid).child('uniqueId').val() === $uniqueId || auth.email === 'your-email@example.com')"
            }
        },
        "users": {
            "$uid": {
                ".read": "auth.uid === $uid || auth.email === 'your-email@example.com'",
                ".write": "auth.uid === $uid || auth.email === 'your-email@example.com'"
            }
        }
    }
}

rules_version = '2';
service firebase.storage {
    match /b/{bucket}/o {
        match /privateChannels/{uniqueId}/{allPaths=**} {
            allow read, write: if request.auth != null && (request.auth.token.email == 'your-email@example.com' || exists(/databases/$(database)/documents/users/$(request.auth.uid)/uniqueId) && get(/databases/$(database)/documents/users/$(request.auth.uid)/uniqueId).data == uniqueId);
        }
    }
}




Run the App:
npm start


Usage:

Access the app at http://localhost:3000.
Enter a unique ID to use the Private Peer Connect feature.
Admin email: Replace your-email@example.com in PrivatePeerConnect.js with your email.
Generate and share unique IDs with 2-3 users for private access.



Features

Focus Dashboard: Displays tasks, streaks, mood check-in, and quotes.
Goals & Tasks: Add and track tasks with localStorage.
Pomodoro Timer: 25-minute work sessions with 5-minute breaks.
Private Peer Connect: One-on-one interaction with image uploads, quote exchange, and messaging, secured by unique IDs.

Notes

Replace favicon.ico in the public folder with your app icon.
Ensure Firebase credentials are correctly configured before running.
The app is designed for web but can be embedded in an Android WebView for cross-platform use.
