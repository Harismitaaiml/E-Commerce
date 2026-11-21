# HobbyHub Backend (frontend-independent)

Node.js/Express REST API for Firebase project `hobby-site-f8f72`. It does not include or modify frontend files.

## Setup
```bash
npm install
npm start
```
Uses Google Application Default Credentials. In Cloud Shell, the signed-in account is used for local execution. On Cloud Run, attach a service account with `roles/datastore.user`.

## APIs
- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:productId`
- `POST /api/customers` JSON: `{"name":"Test","email":"test@example.com","phone":"9876543210"}`
- `GET /api/customers/:customerId`
- `POST /api/orders` JSON:
```json
{"customer":{"name":"Test","email":"test@example.com","phone":"9876543210"},"address":{"line1":"12 Main Road","city":"Chennai","state":"Tamil Nadu","postalCode":"600001"},"items":[{"productId":"P001","quantity":1}]}
```
- `GET /api/orders/:orderId`

Prices are read from Firestore `pricePaise`; browser totals are never trusted. Order placement uses a Firestore transaction to validate stock, decrement quantities, and create the order.

## Migration
Run `npm run migrate`. It creates `_schema` placeholder docs in `customers`, `orders`, and `admins` only if absent. Existing data and `products` are not changed. It is safe to rerun.

## Cloud Run
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
PROJECT_NUMBER=$(gcloud projects describe hobby-site-f8f72 --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding hobby-site-f8f72 --member="serviceAccount:${SA}" --role="roles/datastore.user"
gcloud run deploy hobbyhub-api --source . --region asia-south1 --service-account "$SA" --allow-unauthenticated --set-env-vars "GOOGLE_CLOUD_PROJECT=hobby-site-f8f72"
```

## Security limitations — read before public deployment
No verified customer identity is implemented because Firebase Authentication was excluded. Public order lookup by order ID is demo-only and must not expose real customer data in production. Customer creation does not verify email ownership. Admin authentication and admin APIs are not implemented. Add verified identity, authorization, rate limiting, and privacy controls before real use. Firebase Admin SDK bypasses Firestore Security Rules; Cloud Run service-account IAM is the database access boundary.
