# ClearGive Technical Project Report

**Scope:** Current implementation in this workspace, reviewed 2026-10-04. This report describes code paths that exist now; it does not treat README feature claims as proof of implementation. Environment variable names are listed without values.

## Executive Summary

ClearGive is a React/Vite single-page application backed by a Node.js/Express API and MongoDB/Mongoose. The implemented workflow centers on partner-created donation drives, partners recording physical donations against registered donor accounts, and partners recording distribution quantities and beneficiary counts. Partner verification gates partner drive operations. Admins can review verification requests and inspect drives, donations, distributions, logs, and aggregated analytics.

Two prominent contract gaps affect active workflows: partner donation responses expose `id`, while the distribution screen expects `_id`; and optional distribution proof metadata is accepted by the controller without an `extension`, although the Mongoose schema requires one. Partner verification document forms likewise collect metadata only; the project does not transfer or store document bytes.

## 1. Frontend

### Structure and entry points

- The Vite/React entry and app composition are in [client-frontend/src/main.jsx](client-frontend/src/main.jsx) and [client-frontend/src/App.jsx](client-frontend/src/App.jsx).
- Route declarations and the three role route groups are in [client-frontend/src/routes/AppRoutes.jsx](client-frontend/src/routes/AppRoutes.jsx). Session guards are [client-frontend/src/routes/ProtectedRoute.jsx](client-frontend/src/routes/ProtectedRoute.jsx) and [client-frontend/src/routes/PublicOnlyRoute.jsx](client-frontend/src/routes/PublicOnlyRoute.jsx); role labels and dashboard redirect paths are in [client-frontend/src/routes/routeUtils.js](client-frontend/src/routes/routeUtils.js).
- Authentication state is supplied by [client-frontend/src/context/AuthContext.jsx](client-frontend/src/context/AuthContext.jsx), with its hook/context definitions in [client-frontend/src/context/useAuth.js](client-frontend/src/context/useAuth.js) and [client-frontend/src/context/auth-context.js](client-frontend/src/context/auth-context.js). HTTP requests and local token handling are centralized in [client-frontend/src/services/api.js](client-frontend/src/services/api.js).
- The shared authenticated shell, role navigation, theme toggle, and notification bell are in [client-frontend/src/layouts/AppLayout.jsx](client-frontend/src/layouts/AppLayout.jsx) and [client-frontend/src/components/notifications/NotificationBell.jsx](client-frontend/src/components/notifications/NotificationBell.jsx).

### Routes and role access

| Route | Page / access |
| --- | --- |
| `/` | Public landing page: [client-frontend/src/pages/dashboards/DashboardPage.jsx](client-frontend/src/pages/dashboards/DashboardPage.jsx) |
| `/login`, `/register` | Public-only [LoginPage.jsx](client-frontend/src/pages/auth/LoginPage.jsx) and [RegisterPage.jsx](client-frontend/src/pages/auth/RegisterPage.jsx); authenticated users are redirected to their role dashboard |
| `/donor`, `/donor/drives`, `/donor/drives/:id`, `/donor/history`, `/donor/settings` | Donor-only dashboard, drive browsing/details, history, and settings |
| `/partner`, `/partner/drives`, `/partner/drives/new`, `/partner/drives/:id`, `/partner/drives/:id/edit`, `/partner/drives/:id/donations`, `/partner/drives/:id/distributions`, `/partner/verification`, `/partner/settings` | Partner-only dashboard, drive management, donation/distribution entry, verification, and settings |
| `/admin`, `/admin/activity`, `/admin/verifications`, `/admin/drives`, `/admin/drives/:id`, `/admin/donations`, `/admin/distributions`, `/admin/analytics`, `/admin/settings` | Admin-only dashboard, review, monitoring, and reports |
| `*` | [client-frontend/src/pages/NotFoundPage.jsx](client-frontend/src/pages/NotFoundPage.jsx) |

The route guard checks the authenticated user's role on the client. This is navigation control only; the API independently authenticates and authorizes each protected route. Session tokens are stored in `localStorage` under `cleargive_token`, attached as bearer tokens, and restored by requesting `/auth/me`.

### Donor features

- Donors browse active drives with text/category/location filters and view drive details and received-quantity progress. The active pages are [DonorDrivesPage.jsx](client-frontend/src/pages/donor/DonorDrivesPage.jsx) and [DonorDriveDetailsPage.jsx](client-frontend/src/pages/donor/DonorDriveDetailsPage.jsx).
- Donors see donation totals/recent activity and full donation history through [DonorDashboard.jsx](client-frontend/src/pages/dashboards/DonorDashboard.jsx) and [DonorHistoryPage.jsx](client-frontend/src/pages/donor/DonorHistoryPage.jsx).
- The drive detail tells donors to bring goods to the partner, who records them upon receipt. There is no active donor self-service donation submission route. [DonorRecordDonationPage.jsx](client-frontend/src/pages/donor/DonorRecordDonationPage.jsx) exists but is not imported or routed by `AppRoutes.jsx`; its POST request also does not match the current backend's partner-only donation contract.
- Donor settings are read-only in [SettingsPage.jsx](client-frontend/src/pages/settings/SettingsPage.jsx).

### Partner features

- Partners view their own drives, create/edit drives, pause/reactivate drives, and access each drive's donations/distributions. Main pages: [PartnerDashboard.jsx](client-frontend/src/pages/dashboards/PartnerDashboard.jsx), [PartnerDrivesPage.jsx](client-frontend/src/pages/partner/PartnerDrivesPage.jsx), [PartnerCreateDrivePage.jsx](client-frontend/src/pages/partner/PartnerCreateDrivePage.jsx), [PartnerDriveDetailsPage.jsx](client-frontend/src/pages/partner/PartnerDriveDetailsPage.jsx), [PartnerEditDrivePage.jsx](client-frontend/src/pages/partner/PartnerEditDrivePage.jsx), [PartnerDriveDonationsPage.jsx](client-frontend/src/pages/partner/PartnerDriveDonationsPage.jsx), and [PartnerDriveDistributionsPage.jsx](client-frontend/src/pages/partner/PartnerDriveDistributionsPage.jsx).
- Drive creation/edit fields are title, description, category, target quantity, location, and optional assistance reference. Partner settings and verification state are read-only apart from the separate verification workflow.

### Admin features

- Admin screens show summary counts, verification queue, drive/donation/distribution records, activity logs, and analytics. Pages: [AdminDashboard.jsx](client-frontend/src/pages/dashboards/AdminDashboard.jsx), [AdminVerificationPage.jsx](client-frontend/src/pages/admin/AdminVerificationPage.jsx), [AdminDrivesPage.jsx](client-frontend/src/pages/admin/AdminDrivesPage.jsx), [AdminDriveDetailsPage.jsx](client-frontend/src/pages/admin/AdminDriveDetailsPage.jsx), [AdminDonationsPage.jsx](client-frontend/src/pages/admin/AdminDonationsPage.jsx), [AdminDistributionsPage.jsx](client-frontend/src/pages/admin/AdminDistributionsPage.jsx), [AdminActivityPage.jsx](client-frontend/src/pages/admin/AdminActivityPage.jsx), and [AdminAnalyticsPage.jsx](client-frontend/src/pages/admin/AdminAnalyticsPage.jsx).
- Admin drive/donation/distribution views are monitoring views; no admin edit/delete action is implemented for these records. There is no user-management screen or account suspension endpoint in the mounted feature routes.

## 2. Backend

### Server and API mounts

[server-backend/server.js](server-backend/server.js) loads dotenv, configures Helmet, default CORS middleware, JSON parsing with a 1 MB limit, and a global rate limiter; it mounts the routers below, then not-found and error handlers. MongoDB connection is started by [server-backend/config/db.js](server-backend/config/db.js). Package scripts are `start` and `dev` in [server-backend/package.json](server-backend/package.json).

| API prefix | Responsibility | Router |
| --- | --- | --- |
| `/api/auth` | Registration, login, current user | [authRoutes.js](server-backend/routes/authRoutes.js) |
| `/api/protected` | Small protected-access examples | [protectedRoutes.js](server-backend/routes/protectedRoutes.js) |
| `/api/partner-verification` | Partner submit/read/resubmit | [partnerVerificationRoutes.js](server-backend/routes/partnerVerificationRoutes.js) |
| `/api/admin/partner-verifications` | Admin verification review | [adminPartnerVerificationRoutes.js](server-backend/routes/adminPartnerVerificationRoutes.js) |
| `/api/drives` | Public listing/details of active drives | [donationDriveRoutes.js](server-backend/routes/donationDriveRoutes.js) |
| `/api/partner/drives` | Partner-owned drive, donor search, donation, distribution operations | [partnerDriveRoutes.js](server-backend/routes/partnerDriveRoutes.js) |
| `/api/admin/drives` | Admin drive listing/details | [adminDriveRoutes.js](server-backend/routes/adminDriveRoutes.js) |
| `/api/admin` | Admin aggregate user counts | [adminRoutes.js](server-backend/routes/adminRoutes.js) |
| `/api/donations` | Donor's own and admin-wide donations | [donationRoutes.js](server-backend/routes/donationRoutes.js) |
| `/api/distributions` | Admin-wide distributions | [distributionRoutes.js](server-backend/routes/distributionRoutes.js) |
| `/api/activity` | Admin activity log | [activityRoutes.js](server-backend/routes/activityRoutes.js) |
| `/api/notifications` | Current user's notifications/read state | [notificationRoutes.js](server-backend/routes/notificationRoutes.js) |
| `/api/analytics` | Admin analytics aggregates | [analyticsRoutes.js](server-backend/routes/analyticsRoutes.js) |

The principal feature logic is in [authController.js](server-backend/controllers/authController.js), [partnerVerificationController.js](server-backend/controllers/partnerVerificationController.js), [donationDriveController.js](server-backend/controllers/donationDriveController.js), [donationController.js](server-backend/controllers/donationController.js), [distributionController.js](server-backend/controllers/distributionController.js), [notificationController.js](server-backend/controllers/notificationController.js), [analyticsController.js](server-backend/controllers/analyticsController.js), [adminController.js](server-backend/controllers/adminController.js), and [activityController.js](server-backend/controllers/activityController.js). Shared cross-cutting code is under [server-backend/middleware](server-backend/middleware) and [server-backend/utils](server-backend/utils).

### Authentication and authorization

- Registration allows only `donor` and `partner`; admin registration is explicitly rejected. Passwords are hashed with bcryptjs in the `User` save hook. Login creates a JWT with the user id and role; authenticated requests verify it and reload the current user from MongoDB.
- [authMiddleware.js](server-backend/middleware/authMiddleware.js) implements bearer-token authentication and role authorization. [partnerVerificationMiddleware.js](server-backend/middleware/partnerVerificationMiddleware.js) requires approved partner status for partner drive operations and additionally restricts verification review to the admin whose email matches configured `ADMIN_EMAIL`.
- Request validation and allowlists are in [validation.js](server-backend/middleware/validation.js). Rate limits are defined in [rateLimiter.js](server-backend/middleware/rateLimiter.js); error responses are normalized by [errorHandler.js](server-backend/middleware/errorHandler.js).
- Activity logging and notification writes are best-effort helpers: [activityLogger.js](server-backend/utils/activityLogger.js) and [notificationService.js](server-backend/utils/notificationService.js) catch persistence errors rather than failing the main request.

## 3. Partner Verification

1. A partner registers, creating a user whose verification status begins as `not_submitted`.
2. The partner form at [PartnerVerificationPage.jsx](client-frontend/src/pages/partner/PartnerVerificationPage.jsx) sends organization/contact fields and three actual files: registration certificate, supporting organization document, and representative government ID. First submission requires all three. A rejected resubmission can replace files selectively; a legacy metadata-only document must be re-uploaded.
3. [DocumentMetadataFields.jsx](client-frontend/src/components/verification/DocumentMetadataFields.jsx) uses browser file inputs and displays the selected filename. [documentMetadata.js](client-frontend/src/components/verification/documentMetadata.js) checks extension, browser MIME type when available, and the existing 10 MB per-file limit. The backend receives `multipart/form-data`, validates PDF/JPEG/PNG signatures and size, and generates metadata; client-supplied metadata is not accepted.
4. Local development stores files privately under the ignored `server-backend/.private/verification-documents` directory, with generated keys and metadata stored in [PartnerVerification.js](server-backend/models/PartnerVerification.js). Files are not served publicly. No persistent production storage provider is configured; upload is disabled in production/Render until one is selected and implemented.
5. Partner statuses remain `not_submitted`, `pending`, `approved`, and `rejected`. Admins see pending submissions in [AdminVerificationPage.jsx](client-frontend/src/pages/admin/AdminVerificationPage.jsx) and can download stored files through the authenticated admin-only endpoint. Approve/reject, rejection reasons, review attribution, and notifications/activity behavior remain in place.

Backend owners: [PartnerVerification.js](server-backend/models/PartnerVerification.js), [verificationDocumentStorage.js](server-backend/utils/verificationDocumentStorage.js), [verificationDocumentUpload.js](server-backend/middleware/verificationDocumentUpload.js), verification endpoints in [partnerVerificationRoutes.js](server-backend/routes/partnerVerificationRoutes.js) and [adminPartnerVerificationRoutes.js](server-backend/routes/adminPartnerVerificationRoutes.js), plus [partnerVerificationController.js](server-backend/controllers/partnerVerificationController.js). Multipart and authenticated binary requests are handled by [api.js](client-frontend/src/services/api.js); admin document controls are in [VerificationSummary.jsx](client-frontend/src/components/verification/VerificationSummary.jsx) and [AdminVerificationPage.jsx](client-frontend/src/pages/admin/AdminVerificationPage.jsx).

## 4. Donation System

- Public drive listings/details are active-only and include totals derived from donation records. Partners create/manage their own drives; drive status values are `active`, `paused`, `completed`, and `cancelled`. The partner status transition rules allow active to paused/completed/cancelled and paused to active/completed/cancelled; completed/cancelled are terminal.
- On a drive's donations page, a partner searches registered active donor accounts by name (minimum two characters; up to ten matches), selects a donor, then submits item and positive integer quantity. The API revalidates that the selected user is an active donor. It copies the donor's registered name server-side and disallows manual contributor name input.
- This is a physical-donation intake record: creation stores `status: Received`, and sets received/recorded times and the partner receiver immediately. Donation model enum is `Recorded`, `Received`, `Distributed`; `Recorded` remains for legacy data and a legacy receive endpoint, but current partner creation does not create that status.
- Donors can read only their own history; admins can read all. The donor UI explains that contributions are brought to the listed location and recorded by the partner; it does not create a donor-originated donation.

Frontend: [PartnerDriveDonationsPage.jsx](client-frontend/src/pages/partner/PartnerDriveDonationsPage.jsx), [DonorDrivesPage.jsx](client-frontend/src/pages/donor/DonorDrivesPage.jsx), [DonorDriveDetailsPage.jsx](client-frontend/src/pages/donor/DonorDriveDetailsPage.jsx), [DonorHistoryPage.jsx](client-frontend/src/pages/donor/DonorHistoryPage.jsx). Backend: [partnerDriveRoutes.js](server-backend/routes/partnerDriveRoutes.js), [donationRoutes.js](server-backend/routes/donationRoutes.js), [donationController.js](server-backend/controllers/donationController.js), [Donation.js](server-backend/models/Donation.js), and [DonationDrive.js](server-backend/models/DonationDrive.js).

## 5. Distribution System

- A verified partner selects one of the drive's `Received` donations and submits a positive integer quantity, positive integer beneficiary count, optional notes, and optional proof metadata.
- The backend sums existing distribution records for that donation and rejects a requested quantity greater than `donation.quantity - alreadyDistributed`. Each distribution stores drive, donation, quantity, beneficiary count, optional notes/proof metadata, recording partner, and timestamps.
- The donation changes to `Distributed` only when cumulative distributed quantity equals its full received quantity; partial distributions leave it `Received`. There is no separate distribution status field.
- Beneficiary tracking is an aggregate integer count per distribution, summed in dashboards and analytics. No individual beneficiary identity, case record, or beneficiary collection/model exists.
- Distribution records notify the donor and recording partner. Admins can inspect all records.

Frontend: [PartnerDriveDistributionsPage.jsx](client-frontend/src/pages/partner/PartnerDriveDistributionsPage.jsx), [AdminDistributionsPage.jsx](client-frontend/src/pages/admin/AdminDistributionsPage.jsx), [AdminDriveDetailsPage.jsx](client-frontend/src/pages/admin/AdminDriveDetailsPage.jsx). Backend: distribution endpoints in [partnerDriveRoutes.js](server-backend/routes/partnerDriveRoutes.js), [distributionRoutes.js](server-backend/routes/distributionRoutes.js), implementation in [distributionController.js](server-backend/controllers/distributionController.js), schema in [Distribution.js](server-backend/models/Distribution.js).

## 6. Notifications

Notifications are persisted in MongoDB with recipient, role, type, title, message, optional resource reference, read flag, and timestamps. Feature actions attempt to notify relevant partners, donors, and admins. Authenticated users can list their latest 50 notifications, get an unread count, mark one as read, or mark all as read. The UI polls every 30 seconds and refreshes on window focus; delivery is not WebSocket/push based. Notification resource links are mapped by role in the bell component.

Files: [Notification.js](server-backend/models/Notification.js), [notificationService.js](server-backend/utils/notificationService.js), [notificationController.js](server-backend/controllers/notificationController.js), [notificationRoutes.js](server-backend/routes/notificationRoutes.js), [NotificationBell.jsx](client-frontend/src/components/notifications/NotificationBell.jsx).

## 7. Analytics

The admin-only `/api/analytics/admin` endpoint calculates totals and breakdowns in JavaScript from MongoDB reads: drives by status/category; donated, received, and distributed item counts; beneficiary counts; monthly created-drive/donation/distribution activity; per-drive totals; and average/longest elapsed days from receipt to full donation distribution. The admin page renders summary values and simple CSS bar charts and supports manual refresh. This is implemented in Node/Mongoose, not by a connected Spark job.

Files: [analyticsRoutes.js](server-backend/routes/analyticsRoutes.js), [analyticsController.js](server-backend/controllers/analyticsController.js), [AdminAnalyticsPage.jsx](client-frontend/src/pages/admin/AdminAnalyticsPage.jsx), [DashboardStat.jsx](client-frontend/src/components/dashboard/DashboardStat.jsx). The general user-count endpoint is [adminController.js](server-backend/controllers/adminController.js), used by [AdminDashboard.jsx](client-frontend/src/pages/dashboards/AdminDashboard.jsx).

## 8. Database Models / Collections

Mongoose models and their current responsibilities (MongoDB collection names follow Mongoose's default pluralization):

| Model | Stored data |
| --- | --- |
| `User` / `users` | Name, email, contact, password hash, role, active/suspended status, partner organization summary, approval/verification status, login timestamps |
| `PartnerVerification` / `partnerverifications` | One verification document per user, organization/representative details, three document metadata records, status and admin review fields |
| `DonationDrive` / `donationdrives` | Partner-owned drive description/category/target/location/status |
| `Donation` / `donations` | Registered donor, drive, item/quantity, lifecycle status and received/distributed attribution/timestamps |
| `Distribution` / `distributions` | Drive/donation, distributed quantity, beneficiary count, notes, proof metadata and recording partner |
| `Notification` / `notifications` | User-targeted message and read state |
| `ActivityLog` / `activitylogs` | Actor/role, action, resource reference, details, result, timestamp |

Model files: [User.js](server-backend/models/User.js), [PartnerVerification.js](server-backend/models/PartnerVerification.js), [DonationDrive.js](server-backend/models/DonationDrive.js), [Donation.js](server-backend/models/Donation.js), [Distribution.js](server-backend/models/Distribution.js), [Notification.js](server-backend/models/Notification.js), [ActivityLog.js](server-backend/models/ActivityLog.js). There is no separate beneficiary, uploaded-file, or analytics model.

## 9. Environment Variables and External Services

Names below are taken from `.env.example` and direct code references; no values are included.

| Variable | Use |
| --- | --- |
| `PORT` | Express listening port; defaults to 5000 when unset |
| `MONGO_URI` | Mongoose MongoDB connection string |
| `JWT_SECRET` | JWT signing and verification secret |
| `JWT_EXPIRES_IN` | JWT expiration duration; code defaults to one hour |
| `ADMIN_EMAIL` | Email allowlist for configured admin-only partner verification review actions |
| `ALLOW_LOCAL_RATE_LIMIT_TESTING` | Enables localhost rate-limit bypass only outside production when explicitly set to `true` |
| `NODE_ENV` | Used to prevent that bypass in production |
| `VITE_API_URL` | Frontend API base URL; defaults to `http://localhost:5000/api` |

`PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, and `ALLOW_LOCAL_RATE_LIMIT_TESTING` are present in [server-backend/.env.example](server-backend/.env.example). `NODE_ENV` and `VITE_API_URL` are additional code-read variables. MongoDB is the only configured external service. Verification files use a private local-development adapter; production/Render uploads are deliberately disabled because no persistent storage provider, bucket, or credentials are configured. No email delivery provider or Spark service integration is present. The README describes Python/PySpark analytics, but there are no Python source files in this workspace; the checked-in analytics endpoint is Node.js code.

## 10. Incomplete or Potentially Problematic Areas

1. **Partner distribution ID and proof metadata contracts are aligned.** The distribution page accepts the current donation `id` shape, and optional proof metadata validation matches its schema.
2. **Production verification storage is not configured.** Local development uses private local files, but Render filesystem persistence cannot be assumed. Upload requests are disabled in production/Render; a persistent provider and its deployment configuration are required before production uploads can be enabled.
4. **Orphan donor record page.** `DonorRecordDonationPage.jsx` is not routed. Its POST request does not match the mounted API contract: the public `/api/drives` router is GET-only, and the partner donation creation endpoint requires partner authorization and a registered `donorId`.
5. **Unauthenticated protected-route shell may throw before redirect.** `AppLayout` is the parent route around protected groups and immediately reads `user.role`; `ProtectedRoute` is nested inside it. If a signed-out visitor directly enters a protected URL, the shell can dereference `user` before the nested guard redirects.
6. **Distribution quantity enforcement is not concurrency-safe.** The controller reads the aggregate distributed quantity, checks the remainder, and then inserts a new distribution in separate operations. Concurrent submissions for the same donation can both pass the check and exceed the available quantity.
7. **Admin bootstrap/user management is absent from mounted features.** Public registration disallows admins, and no admin creation/seed workflow or user-management/suspension endpoint is present in the inspected project source. Admin features therefore depend on an account provisioned outside the ordinary registration flow. `ADMIN_EMAIL` additionally must match the reviewing admin account for verification actions.
8. **Admin analytics and lists are unpaginated.** Analytics reads all drives, donations, and distributions into application memory. Admin listing endpoints also retrieve full collections; drive stats are built with additional per-drive reads. This can become expensive as data volume grows.
9. **Settings are read-only and contact data is incomplete.** Settings explicitly says profile editing is unavailable. `/auth/me` omits `contactNumber`, so non-partner settings cannot populate the stored contact value from the current user response.
10. **Operational configuration deserves deployment review.** The server uses default `cors()` behavior, and the browser stores the bearer token in localStorage. These are the current implementation choices; production origin policy and token threat model are not configured in the inspected source.
11. **Documentation/runtime mismatch.** [README.md](README.md) lists Python + Apache Spark/PySpark for analytics, but analytics is computed in [analyticsController.js](server-backend/controllers/analyticsController.js), and no Python analytics source was found.
12. **Best-effort audit/notification persistence.** Failures in the activity logger and notification helper are logged and swallowed. The main operation can report success even when its corresponding audit entry or user notification was not saved.

## 11. Main File Index by Feature

- Frontend routes/auth/shell: [AppRoutes.jsx](client-frontend/src/routes/AppRoutes.jsx), [ProtectedRoute.jsx](client-frontend/src/routes/ProtectedRoute.jsx), [PublicOnlyRoute.jsx](client-frontend/src/routes/PublicOnlyRoute.jsx), [AuthContext.jsx](client-frontend/src/context/AuthContext.jsx), [api.js](client-frontend/src/services/api.js), [AppLayout.jsx](client-frontend/src/layouts/AppLayout.jsx).
- Verification: [PartnerVerificationPage.jsx](client-frontend/src/pages/partner/PartnerVerificationPage.jsx), [DocumentMetadataFields.jsx](client-frontend/src/components/verification/DocumentMetadataFields.jsx), [documentMetadata.js](client-frontend/src/components/verification/documentMetadata.js), [VerificationSummary.jsx](client-frontend/src/components/verification/VerificationSummary.jsx), [AdminVerificationPage.jsx](client-frontend/src/pages/admin/AdminVerificationPage.jsx), [api.js](client-frontend/src/services/api.js), [partnerVerificationRoutes.js](server-backend/routes/partnerVerificationRoutes.js), [adminPartnerVerificationRoutes.js](server-backend/routes/adminPartnerVerificationRoutes.js), [verificationDocumentUpload.js](server-backend/middleware/verificationDocumentUpload.js), [partnerVerificationController.js](server-backend/controllers/partnerVerificationController.js), [verificationDocumentStorage.js](server-backend/utils/verificationDocumentStorage.js), [PartnerVerification.js](server-backend/models/PartnerVerification.js).
- Drives/donations/distributions: [PartnerDrivesPage.jsx](client-frontend/src/pages/partner/PartnerDrivesPage.jsx), [PartnerDriveDonationsPage.jsx](client-frontend/src/pages/partner/PartnerDriveDonationsPage.jsx), [PartnerDriveDistributionsPage.jsx](client-frontend/src/pages/partner/PartnerDriveDistributionsPage.jsx), [DonorDrivesPage.jsx](client-frontend/src/pages/donor/DonorDrivesPage.jsx), [DonorHistoryPage.jsx](client-frontend/src/pages/donor/DonorHistoryPage.jsx), [partnerDriveRoutes.js](server-backend/routes/partnerDriveRoutes.js), [donationDriveController.js](server-backend/controllers/donationDriveController.js), [donationController.js](server-backend/controllers/donationController.js), [distributionController.js](server-backend/controllers/distributionController.js), [DonationDrive.js](server-backend/models/DonationDrive.js), [Donation.js](server-backend/models/Donation.js), [Distribution.js](server-backend/models/Distribution.js).
- Notifications/activity/analytics: [NotificationBell.jsx](client-frontend/src/components/notifications/NotificationBell.jsx), [notificationController.js](server-backend/controllers/notificationController.js), [notificationService.js](server-backend/utils/notificationService.js), [AdminActivityPage.jsx](client-frontend/src/pages/admin/AdminActivityPage.jsx), [activityController.js](server-backend/controllers/activityController.js), [activityLogger.js](server-backend/utils/activityLogger.js), [AdminAnalyticsPage.jsx](client-frontend/src/pages/admin/AdminAnalyticsPage.jsx), [analyticsController.js](server-backend/controllers/analyticsController.js).
- Server/security/database/config: [server.js](server-backend/server.js), [db.js](server-backend/config/db.js), [authMiddleware.js](server-backend/middleware/authMiddleware.js), [partnerVerificationMiddleware.js](server-backend/middleware/partnerVerificationMiddleware.js), [validation.js](server-backend/middleware/validation.js), [rateLimiter.js](server-backend/middleware/rateLimiter.js), [errorHandler.js](server-backend/middleware/errorHandler.js), [server-backend/.env.example](server-backend/.env.example).