# Setup: anonymous stats (Firebase)

Do these once in the Firebase console for project `kerbalist-7dfaf`.

1. **Analytics** is already set up (it uses the `measurementId` in the config).
2. **Authentication**: Build → Authentication → Get started → Sign-in method → enable **Anonymous**.
3. **Firestore**: Build → Firestore Database → Create database (production mode).
4. **Create the counter document** (the app can only update it, so it must exist first):
   - Collection `stats`, document ID `global`, with these fields (all number type):
     - `transfers` = 0
     - `livesyncs` = 0
     - `sessions` = 0
     - `users` = 0
5. **Rules**: Firestore → Rules → paste the contents of `firestore.rules` → Publish.
6. **Test**: open the app from the hosted page, turn **Anonymous stats** on in the menu, plan a transfer, then check the `stats/global` counters in the console.

Notes:
- Stats are off until a user turns them on, and turning them off stops analytics collection.
- Each browser counts once as a user, using an anonymous ID with no personal data.
- Analytics does not run when the app is opened from a local file.
- The overlay reads the totals and shows "Kerbalists" (users) and "Transfers".
