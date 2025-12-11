
# Running RecallApp (ConsumeSafe) with Cloudflare Tunnel + Expo

This guide shows you how to:

1. Install and run **Cloudflare Tunnel** (cloudflared)
2. Start the **Rails backend** (`RecallBackend`)
3. Start the **Expo frontend** (`mobile`) in:

   * **Web mode** – can test **Google Sign-In**
   * **Tunnel mode** – use **Expo Go on your phone** to test everything else
4. Recognize the **logs** you should see when everything is wired correctly

> ⚠️ Google & Apple login:
>
> * **Google Sign-In** – works on **web** (Expo web)
> * **Mobile (Expo Go / `--tunnel`)** – use **email/password login** for now (Google & Apple sign-in are not guaranteed there).

---

## 1. Prerequisites

You should have:

* **git**
* **Node.js** (LTS 18+ is recommended)
* **npm** or **yarn**
* **Ruby** (matching the project version, e.g. `3.4.x`)
* **Bundler** (Ruby gem)
* **PostgreSQL**
* A free **Cloudflare account**
* **cloudflared** CLI installed

### Install cloudflared

#### macOS (Homebrew)

```bash
brew install cloudflare/cloudflare/cloudflared
```

#### Debian/Ubuntu

```bash
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
rm cloudflared.deb
```

#### Windows (choco)

In an **elevated PowerShell**:

```powershell
choco install cloudflared
```

Verify:

```bash
cloudflared --version
```

---

## 2. Clone the project

```bash
git clone <your-repo-url> Capstone_Project
cd Capstone_Project
```

Repo structure (relevant folders):

* `RecallBackend/` – Rails API
* `mobile/` – Expo React Native front-end

---

## 3. Backend: install gems & run Rails

### 3.1 Install Bundler and gems

From the project root:

```bash
cd RecallBackend

# Install bundler if needed
gem install bundler

# Install project gems
bundle install
```

If you hit gem version errors, make sure you are using the Ruby version specified for the project (e.g. via `rbenv` or `asdf`).

### 3.2 Setup the database

Still in `RecallBackend`:

```bash
bin/rails db:setup
# or, if bin/rails isn't available
rails db:setup
```

This creates the database, runs migrations, and seeds data (including sample FDA recall data via `FoodEventImporter`).

### 3.3 Start Rails

```bash
bin/rails server -b 0.0.0.0 -p 3000
# or
rails server -b 0.0.0.0 -p 3000
```

✅ **You’re looking for logs like:**

```text
=> Booting Puma
=> Rails 8.0.3 application starting in development
* Listening on http://0.0.0.0:3000
[FoodEventImporter] Running on server start...
[FoodEventImporter] Completed successfully.
```

If you hit `Started GET "/..."` lines when you make requests later, that’s good – it means Rails is receiving traffic.

---

## 4. Cloudflare Tunnel: expose Rails as `https://api.consumesafe.app`

> If you are running this on your own Cloudflare account/domain, replace `consumesafe.app` and `api.consumesafe.app` with your own domain.

### 4.1 Log in to Cloudflare

```bash
cloudflared tunnel login
```

This opens a browser to authenticate your Cloudflare account.

### 4.2 Create a named tunnel

```bash
cloudflared tunnel create recall-app
```

Cloudflare will print a **tunnel ID** and a path to a **credentials file**, e.g.:

```text
Tunnel credentials written to /home/you/.cloudflared/<TUNNEL_ID>.json
```

### 4.3 Create a DNS record for the tunnel

In your terminal:

```bash
cloudflared tunnel route dns recall-app api.consumesafe.app
```

Cloudflare will create a proxied `CNAME` record that points `api.consumesafe.app` at your tunnel.

### 4.4 Configure tunnel ingress

Create or edit `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_ID_FROM_ABOVE>
credentials-file: /home/<your-user>/.cloudflared/<TUNNEL_ID_FROM_ABOVE>.json

ingress:
  - hostname: api.consumesafe.app
    service: http://localhost:3000
  - service: http_status:404
```

> 🔁 If you’re on Windows, the credentials file will be under something like:
> `C:\Users\<you>\.cloudflared\<TUNNEL_ID>.json`

### 4.5 Run the tunnel

With Rails still running on port 3000, start the tunnel:

```bash
cloudflared tunnel run recall-app
```

✅ **You’re looking for logs like:**

```text
INF Starting tunnel tunnelID=90302b30-5a38-4254-8fcb-03398c9a6a6d
INF Updated to new configuration config="{\"ingress\":[{\"hostname\":\"api.consumesafe.app\",\"service\":\"http://localhost:3000\"}, ...]}"
INF Registered tunnel connection connIndex=0 ... protocol=quic
INF Registered tunnel connection connIndex=1 ...
...
```

Some warnings about ICMP or UDP buffer size are normal and can be ignored.

### 4.6 Quick sanity check with curl

From any terminal (with the tunnel running and Rails running):

```bash
curl -v https://api.consumesafe.app/api/v1/food_events
```

✅ You should see:

* `SSL certificate verify ok.`
* `HTTP/2 200`
* A JSON array of recall events.

Example snippet:

```text
< HTTP/2 200
< content-type: application/json; charset=utf-8
[
  {"id":3,"product_description":"Whatcom Blue Sliced cheese; ..."},
  {"id":4,"product_description":"Face Rock Creamery Vampire Slayer Garlic Cheddar, ..."},
  ...
]
```

If you see `Blocked hosts: api.consumesafe.app`, it means Rails doesn’t allow that host – you must add:

```rb
# config/environments/development.rb
config.hosts << "api.consumesafe.app"
```

and restart Rails.

---

## 5. Frontend: Expo (mobile/)

The mobile app uses an Axios client that points to the API base URL:

* By default:

```ts
// mobile/lib/api.ts
const API_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    'https://api.consumesafe.app';
```

So if you do **nothing**, it will talk to `https://api.consumesafe.app`.

If you want it to hit a **different** backend (like your own local Rails without Cloudflare), set:

```bash
export EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

before running Expo.

### 5.1 Install dependencies

From the repo root:

```bash
cd mobile
npm install
# or
yarn install
```

---

## 6. Running Expo – web vs mobile

### 6.1 Web mode (for Google Sign-In)

From `mobile/`:

```bash
npx expo start --web
```

Or:

```bash
npx expo start
# then press "w" in the terminal
```

This opens the app in your browser at something like `http://localhost:8081`.

✅ **You’re looking for logs like:**

In the Expo dev terminal:

```text
› Web is waiting on http://localhost:8081
› [web] Logs will appear in the browser console
```

In the browser dev console (press F12):

```text
[API] Platform: web
[API] Base URL: https://api.consumesafe.app
[Auth] Bootstrap - stored token: missing
```

When you try Google Sign-In, you should see logs like:

```text
[Login] Attempting Google login...
[Auth] Starting Google login...
```

And in Rails logs:

```text
Started POST "/api/v1/sessions" for ... at ...
Processing by Api::V1::SessionsController#create as JSON
...
Completed 200 OK in ...
```

### 6.2 Mobile (Expo Go) with tunnel (`--tunnel`)

Use this for testing **email/password login, pantry, recalls, notifications, receipt scanning, etc.**
(But NOT Google/Apple login.)

From `mobile/`:

```bash
npx expo start --tunnel
```

✅ **You’re looking for logs like:**

In the Expo dev terminal:

```text
› Metro waiting on exp://...
› Using Expo Go
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

Then:

1. Install **Expo Go** on your phone.
2. Scan the QR code shown in the terminal.
3. The app will open on your device.

In the device’s console logs (visible in terminal or `expo` devtools), you should see:

```text
[API] Platform: ios
[API] Base URL: https://api.consumesafe.app
[Auth] Starting email login...
[Auth] Login complete, user set
```

And in Rails logs, when you navigate around:

```text
Started GET "/api/v1/me" for 76.xx.xx.xx at ...
Processing by Api::V1::SessionsController#me as JSON
  User Load ... WHERE "users"."id" = 1 ...
Completed 200 OK in ...

Started GET "/api/v1/notifications?page=1&per_page=20" for 76.xx.xx.xx at ...
Processing by Api::V1::NotificationsController#index as JSON
...
Completed 200 OK in ...
```

If you see `Completed 401 Unauthorized`, it usually means:

* The JWT token is missing or expired (check login flow), or
* The Authorization header isn’t being sent – look at `[API] Request with token:` vs `Request WITHOUT token`.

---

## 7. Quick checklist: “Am I doing it right?”

You are **good to go** if:

1. **Rails** shows:

   * `Listening on http://0.0.0.0:3000`
   * `[FoodEventImporter] Completed successfully.`

2. **Cloudflare tunnel** shows:

   * `INF Starting tunnel tunnelID=...`
   * Several `Registered tunnel connection` lines
   * No 525/403 errors when you curl the domain.

3. `curl https://api.consumesafe.app/api/v1/food_events`:

   * Returns `HTTP/2 200` with JSON.

4. **Expo web**:

   * Starts at `http://localhost:8081`
   * Console shows `[API] Base URL: https://api.consumesafe.app`
   * Google login can be tested here.

5. **Expo mobile with `--tunnel`**:

   * Terminal shows `Metro waiting on exp://...`
   * Phone opens the app via Expo Go
   * Email/password login works
   * Rails logs show `/api/v1/me`, `/api/v1/food_events`, `/api/v1/pantries`, `/api/v1/notifications`, etc., returning 200.

If any step doesn’t match these logs, that’s usually the layer where the problem is (Rails, Cloudflare, or Expo).
