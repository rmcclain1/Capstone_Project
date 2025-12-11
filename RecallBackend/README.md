# Running RecallApp (ConsumeSafe) with Cloudflare Tunnel + Expo

> ⚠️ **Google & Apple login**
>
> * **Google Sign-In** – supported on **web** (Expo web).
> * **Mobile / Expo Go / emulators** – use **email/password login** for now. Google & Apple sign-in are not guaranteed there.

---

## Section 1 – Basic Setup (Backend + Frontend)

### 1.1 Prerequisites

You should have:

* **git**
* **Node.js** (LTS 18+ recommended)
* **npm** or **yarn**
* **Ruby** (matching the project version, e.g. `3.4.x`)
* **Bundler** gem
* **PostgreSQL**
* (Optional) Ruby version manager: `rbenv`, `asdf`, or `rvm`

> Cloudflare-specific setup is in **Section 2**.

---

### 1.2 Clone the project

```bash
git clone <your-repo-url> Capstone_Project
cd Capstone_Project
```

Relevant folders:

* `RecallBackend/` – Rails API backend
* `mobile/` – Expo React Native frontend

---

### 1.3 Backend: install gems & run Rails

From the project root:

```bash
cd RecallBackend

# Install bundler if needed
gem install bundler

# Install project gems
bundle install
```

If you get gem / Ruby version errors, make sure you’re using the project’s Ruby version (via `rbenv`, `asdf`, etc.).

#### Database setup

```bash
bin/rails db:setup
# or, if bin/rails isn't available
rails db:setup
```

This will:

* Create the database
* Run migrations
* Seed the database (including imported FDA recall data)

#### Start Rails locally

```bash
bin/rails server -b 0.0.0.0 -p 3000
# or
rails server -b 0.0.0.0 -p 3000
```

✅ Expected logs:

```text
=> Booting Puma
=> Rails 8.0.3 application starting in development
* Listening on http://0.0.0.0:3000
[FoodEventImporter] Running on server start...
[FoodEventImporter] Completed successfully.
```

Later, when the app hits the API, you should see:

```text
Started GET "/api/v1/food_events" for 127.0.0.1 at ...
Processing by Api::V1::FoodEventsController#index as JSON
Completed 200 OK in ...
```

---

### 1.4 Frontend: install dependencies

In a new terminal, from the repo root:

```bash
cd mobile
npm install
# or
yarn install
```

You’ll use different Expo commands depending on whether you are running **web** or **mobile via tunnel** (see Section 2.6).

---

## Section 2 – Cloudflare + Expo (Tunnel, Logs, Commands, Environments)

This section shows how to:

* Expose your local Rails backend through **Cloudflare Tunnel**
* Use that API from **Expo web** and **Expo Go / emulators**
* Know **which command** to run and **what logs** to look for
* Understand **which features** work in which environment

---

### 2.1 Install & log in to `cloudflared`

#### Install `cloudflared`

**macOS (Homebrew)**

```bash
brew install cloudflare/cloudflare/cloudflared
```

**Debian/Ubuntu**

```bash
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
rm cloudflared.deb
```

**Windows (Chocolatey, elevated PowerShell)**

```powershell
choco install cloudflared
```

Verify:

```bash
cloudflared --version
```

Log in to your Cloudflare account:

```bash
cloudflared tunnel login
```

A browser window will open to authenticate you.

> If you’re using your own domain, replace `consumesafe.app` / `api.consumesafe.app` with your own throughout this section.

---

### 2.2 Create tunnel + DNS route

Create a named tunnel:

```bash
cloudflared tunnel create recall-app
```

You should see something like:

```text
Tunnel credentials written to /home/you/.cloudflared/<TUNNEL_ID>.json
```

Then create a DNS route:

```bash
cloudflared tunnel route dns recall-app api.consumesafe.app
```

Cloudflare will create a proxied `CNAME` pointing `api.consumesafe.app` at your tunnel.

---

### 2.3 Configure tunnel ingress

Create or edit `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_ID_FROM_ABOVE>
credentials-file: /home/<your-user>/.cloudflared/<TUNNEL_ID_FROM_ABOVE>.json

ingress:
  - hostname: api.consumesafe.app
    service: http://localhost:3000
  - service: http_status:404
```

On Windows, the credentials file path will look like:

```text
C:\Users\<you>\.cloudflared\<TUNNEL_ID>.json
```

---

### 2.4 Allow Cloudflare host in Rails

In `RecallBackend/config/environments/development.rb`:

```rb
config.hosts << "api.consumesafe.app"
```

Restart Rails after changing this.

If you forget this, you’ll see messages like:

```text
Blocked hosts: api.consumesafe.app
```

in the Rails logs.

---

### 2.5 Run Rails + Cloudflare together

Make sure Rails is running:

```bash
cd RecallBackend
bin/rails server -b 0.0.0.0 -p 3000
# or
rails server -b 0.0.0.0 -p 3000
```

In another terminal, start the tunnel:

```bash
cloudflared tunnel run recall-app
```

✅ Expected Cloudflare logs:

```text
INF Starting tunnel tunnelID=90302b30-5a38-4254-8fcb-03398c9a6a6d
INF Updated to new configuration config="{\"ingress\":[{\"hostname\":\"api.consumesafe.app\",\"service\":\"http://localhost:3000\"}, ...]}"
INF Registered tunnel connection connIndex=0 ... protocol=quic
INF Registered tunnel connection connIndex=1 ...
...
```

Warnings about ICMP/UDP buffers are normal.

#### Quick sanity check

```bash
curl -v https://api.consumesafe.app/api/v1/food_events
```

✅ Good signs:

* `SSL certificate verify ok.`
* `HTTP/2 200`
* JSON array of recall events, for example:

```text
< HTTP/2 200
< content-type: application/json; charset=utf-8
[
  {"id":3,"product_description":"Whatcom Blue Sliced cheese; ..."},
  {"id":4,"product_description":"Face Rock Creamery Vampire Slayer Garlic Cheddar, ..."},
  ...
]
```

If you get `Blocked hosts: api.consumesafe.app`, go back to **2.4**.

---

### 2.6 Expo commands: web vs tunnel

All commands run from the `mobile/` folder.

Use `-c` to clear cache, especially after switching networks or modes.

#### Web (best for Google Sign-In)

```bash
cd mobile
npx expo start -c
# then press "w" for web
```

or explicitly:

```bash
npx expo start -c --web
```

This opens your app in a browser at something like `http://localhost:8081`.

**Use this when:**

* You want to test **Google Sign-In**
* You don’t need camera / scanning

#### Mobile – Expo Go / Android Emulator (via tunnel)

```bash
cd mobile
npx expo start -c --tunnel
```

**Use this when:**

* You want to test:

  * Email/password login
  * Pantry and recalls
  * Notifications
  * Barcode / receipt scanning (camera)
* You want to test on a physical phone or emulator using Expo Go

Then:

1. Install **Expo Go** on your phone (Android/iOS) or start an **Android emulator**.
2. Scan the QR code from the terminal (or select the device in Expo dev tools).
3. The app opens on the device.

---

### 2.7 Environment / feature matrix

| Environment                   | Command                      | Good for                                                                | Limitations                                             |
| ----------------------------- | ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| **Expo Web (browser)**        | `npx expo start -c` → `w`    | UI testing, **Google Sign-In**, browsing recalls & pantry               | No camera; receipt/barcode scanning limited             |
| **Expo Go (physical device)** | `npx expo start -c --tunnel` | Email/password login, recalls, pantry, notifications, scanning features | Google/Apple login not guaranteed                       |
| **Android Emulator**          | `npx expo start -c --tunnel` | Similar to Expo Go; good for layout + camera tests                      | Needs emulator camera setup; Google/Apple still limited |

---

### 2.8 Logs to look for

**Rails (backend)** – good signs:

```text
Listening on http://0.0.0.0:3000
[FoodEventImporter] Completed successfully.

Started GET "/api/v1/me" for 76.xx.xx.xx at ...
Processing by Api::V1::SessionsController#me as JSON
Completed 200 OK in ...

Started GET "/api/v1/notifications?page=1&per_page=20" for ...
Processing by Api::V1::NotificationsController#index as JSON
Completed 200 OK in ...
```

Problem signs:

* `Completed 401 Unauthorized` → token missing/expired or Authorization header not sent.
* `Blocked hosts: api.consumesafe.app` → missing `config.hosts << "api.consumesafe.app"`.

---

**Cloudflare (`cloudflared`)** – good signs:

* `INF Registered tunnel connection connIndex=...`
* No constant reconnects or TLS/5xx errors for your hostname

---

**Expo – web**

Terminal:

```text
› Web is waiting on http://localhost:8081
› [web] Logs will appear in the browser console
```

Browser dev console (F12):

```text
[API] Platform: web
[API] Base URL: https://api.consumesafe.app
[Auth] Bootstrap - stored token: missing
[Login] Attempting Google login...
```

---

**Expo – mobile / tunnel**

Terminal:

```text
› Metro waiting on exp://...
› Using Expo Go
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

Device logs (terminal or Expo dev tools):

```text
[API] Platform: ios
[API] Base URL: https://api.consumesafe.app
[Auth] Starting email login...
[Auth] Login complete, user set
```

---

### 2.9 Common issues

* **401 Unauthorized in Rails logs**

  * JWT token missing or expired.
  * Check that login flow completes and token is stored/sent.

* **`Blocked hosts: api.consumesafe.app`**

  * Add `config.hosts << "api.consumesafe.app"` in `development.rb` and restart Rails.

* **curl to `https://api.consumesafe.app` fails**

  * Verify Rails is running on port 3000.
  * Check `ingress` in `config.yml` (`hostname` + `service`).
  * Ensure `cloudflared tunnel run recall-app` is running.

* **Expo stuck / weird after network change**

  * Use `-c` to clear cache: `npx expo start -c` or `npx expo start -c --tunnel`.

---

## Section 3 – Keys & Environment Variables

Some features require keys or env variables.

### 3.1 Rails backend

Depending on setup, you might need:

* **Database credentials** – via `config/database.yml` and local PostgreSQL
* **Rails credentials / master key** – either:

  * `config/master.key`, or
  * `RAILS_MASTER_KEY` env var

If these aren’t set correctly, Rails will usually fail to boot and tell you why.

---

### 3.2 Expo / frontend env vars

The API client determines the base URL like:

```ts
// mobile/lib/api.ts
const API_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.consumesafe.app';
```

You can override this for local-only testing:

```bash
# Example: point directly at local Rails (no Cloudflare)
export EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

If you **don’t** set it, it defaults to:

```text
https://api.consumesafe.app
```

For **Google / Apple / Firebase** auth, look for:

* A Firebase config file (e.g. `mobile/config/firebase.ts`)
* Auth-related env variables, such as:

  * `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
  * `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
  * `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
  * Firebase project keys

Check for `.env`, `.env.local`, `.env.development`, or `.env.example` in the repo and keep variable names consistent.

> Even without these, **email/password auth should work**, but Google/Apple login may fail.

---

### 3.3 Cloudflare

Cloudflare does **not** use env vars for this app. It uses:

* The credentials JSON:

  * `~/.cloudflared/<TUNNEL_ID>.json` (Linux/macOS)
  * `C:\Users\<you>\.cloudflared\<TUNNEL_ID>.json` (Windows)

* The config file:

  * `~/.cloudflared/config.yml`

No additional env vars are needed beyond your own Cloudflare setup.

---

## Section 4 – Summary of Features

These are the main features you can test with this setup.

### 4.1 Authentication

* Email/password sign up and login
* Persistent sessions (JWT) – user should remain logged in after successful auth
* **Google Sign-In** (web only, when configured)
* Apple login integration in progress (environment-dependent)

---

### 4.2 Recalls

* View a list of FDA food recalls (via importer in Rails)
* View recall details: description, product, brand, etc.
* Data served from endpoints like:

  * `GET /api/v1/food_events`

---

### 4.3 Pantry

* Add pantry items (e.g., “milk,” expiration/best-by dates, etc.)
* View the pantry list for the logged-in user
* Backed by:

  * `GET /api/v1/pantries`
  * `POST /api/v1/pantries`
  * and related endpoints

---

### 4.4 Notifications

* View user notifications related to recalls or account activity
* Fetched from:

  * `GET /api/v1/notifications?page=1&per_page=20`

---

### 4.5 Scanning (mobile-focused)

Best tested using **Expo Go** or an **Android emulator** with `--tunnel`:

* **Barcode scanning** – scan product barcodes
* **Receipt scanning** – upload or capture receipt images to extract items

These require camera access and won’t fully work on plain Expo web.

---

### 4.6 Organizations / account management (if enabled in this build)

* Some flows may allow users to join or manage **organizations/households**
* Depending on the current branch, this may include:

  * Organization creation / selection screens
  * Organization-level views of recalls or pantry data

---

### 4.7 Quick “everything is working” checklist

You’re in good shape if:

1. **Rails** shows:

   * `Listening on http://0.0.0.0:3000`
   * `[FoodEventImporter] Completed successfully.`

2. **Cloudflare** shows:

   * `INF Starting tunnel tunnelID=...`
   * Multiple `Registered tunnel connection` lines

3. `curl https://api.consumesafe.app/api/v1/food_events`:

   * Returns `HTTP/2 200` with JSON

4. **Expo web** (`npx expo start -c` → `w`):

   * Loads at `http://localhost:8081`
   * Console shows `[API] Base URL: https://api.consumesafe.app`
   * Google login can be tested

5. **Expo mobile with `--tunnel`**:

   * `npx expo start -c --tunnel`
   * QR code or emulator opens the app
   * Email/password login works
   * Rails logs show `/api/v1/me`, `/api/v1/food_events`, `/api/v1/pantries`, `/api/v1/notifications` returning `200`

If one of these fails, the failing layer (Rails, Cloudflare, or Expo) is the first place to check.
