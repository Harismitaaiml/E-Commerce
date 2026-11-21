# HobbyHub — Updated local run guide

## What changed in this package
- Added nine bundled product artwork files under `public/images/products/`.
- Product cards now display `imageUrl` (if a product has one) or a bundled local category image.
- Product images do not require Firebase Storage, a Blaze plan, or a billing account.
- Added an Admin Login option to the sign-in modal. It verifies the Firebase ID token against the Firestore `admins` collection before opening the dashboard.
- Enabled the protected product create/update/status/delete routes used by the admin dashboard.
- Fixed the admin product form payload to use the backend's field names (`id`, `title`, `qty`, and `imageUrl`).

The bundled images are locally stored category illustrations, not photographs of each exact product. You can replace them later with your own product photos by adding image files under `public/images/products/` and saving their paths as `imageUrl` values.

## Run locally
1. Extract this ZIP.
2. Open the extracted `HobbyHub_Final_Submission_Updated` folder in VS Code.
3. Open a terminal in that folder (the folder containing `package.json`).
4. Run `npm install` once.
5. Make sure your local environment is authenticated for Firebase Admin / Google Application Default Credentials and can access project `hobby-site-f8f72`. Do not put service-account keys in the public folder or commit them to Git.
6. Run `npm start`.
7. Open `http://localhost:8080`.

If port 8080 is already in use, the server may already be running. Check `http://localhost:8080/hobby-api/health` before starting another copy.

## Admin access
- Sign in using the **Admin Login** option in the customer sign-in modal.
- The Firebase Authentication user must have a matching Firestore document at `admins/{uid}` with `role` set to `admin` and `active` set to boolean `true`.
- Admin verification is performed by the backend; simply having a Firebase account does not grant admin access.

## Product images
- Firestore product fields supported by the UI: `imageUrl`, `image`, `image_url`, or `photoURL`.
- If none is present, the app chooses a bundled local illustration based on the product category.
- To use your own photo, put it in `public/images/products/` and set e.g. `imageUrl` to `/images/products/my-product.jpg`.
