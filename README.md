# Farmiculture

Farmiculture is a secure, multi-tenant farm management and agri-tech platform designed to empower farmers, agribusinesses, and agricultural enthusiasts with advanced tools for crop recommendation, disease detection, fertilizer planning, and a full-featured e-commerce store. Leveraging a modern React frontend, a robust Node.js/Express backend, and Python microservices powered by machine learning and deep learning models, Farmiculture delivers end-to-end agricultural solutions.

---

## Table of Contents

* [Features](#features)
* [Architecture & Tech Stack](#architecture--tech-stack)
* [Getting Started](#getting-started)

  * [Prerequisites](#prerequisites)
  * [Environment Variables](#environment-variables)
  * [Installation](#installation)
  * [Running the Application](#running-the-application)
* [Project Structure](#project-structure)
* [API Endpoints](#api-endpoints)
* [Scripts & Jobs](#scripts--jobs)
* [Testing](#testing)
* [Deployment](#deployment)
* [Contributing](#contributing)
* [License](#license)

---

## Features

* **Farm Management Dashboard**: Register farms, manage multiple plots, and track farm details.
* **Crop Recommendation**: ML-based recommendations Naive Bayes tailored to soil, climate, and season.
* **Disease Detection**: Deep learning models (CNN) identify plant diseases from images with high accuracy.
* **Fertilizer Planning**: Intelligent NPK-based fertilizer suggestions using Random Forest & regression models .
* **E-Commerce Store**: Browse and purchase seeds, equipment, fertilizers, and pesticides with Razorpay integration.
* **Forum & Community**: Ask questions, share knowledge, and engage with other farmers.
* **Order Management**: Track orders, view history, and handle payment outcomes with retry mechanisms.
* **Authentication & Security**: JWT-based authentication, OTP email verification, role-based access controls (Admin, Vendor, User).
* **Real-time Updates**: Background jobs for order verification, delivery status updates, and cache management (Redis).
* **Scalable Microservices**: Containerized Python services for AI workloads, easily deployable via Docker.

---

## Architecture & Tech Stack

| Layer              | Technologies                                                 |
| ------------------ | ------------------------------------------------------------ |
| Frontend           | React.js, Create React App, CSS                              |
| Backend API        | Node.js, Express                                             |
| Microservices      | Python (Flask), Docker                                       |
| Database           | MongoDB                                                      |
| Cache              | Redis                                                        |
| Authentication     | JSON Web Tokens, OTP via Email                               |
| Payments           | Razorpay                                                     |
| CI/CD & Deployment | GitHub Actions, Render (Backend & Python), Vercel (Frontend) |
| Email Service      | Nodemailer                                                   |

---

## Getting Started

### Prerequisites

* **Node.js** v14 or higher
* **npm** v6 or higher
* **Python** 3.8 or higher
* **pip** for Python dependencies
* **Docker** (optional, for containerized microservices)
* **MongoDB** instance (local or cloud)
* **Redis** instance (local or cloud)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```dotenv
MONGODB_URI=
JWT_SECRET=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
REDIS_URL=
PORT=5000
```

Create a `client/.env` for React:

```dotenv
REACT_APP_API_URL=http://localhost:5000/api
```

Create a `.env` in `python-service/`:

```dotenv
FLASK_APP=app.py
FLASK_ENV=development
MONGODB_URI=
```

### Installation

1. **Clone the repository**

   ```bash
   ```

git clone [https://github.com/Harshit-Dhundale/FarmiCulture.git](https://github.com/Harshit-Dhundale/FarmiCulture.git)
cd FarmiCulture

````

2. **Install backend dependencies**
   ```bash
npm install
````

3. **Install frontend dependencies**

   ```bash
   ```

cd client
npm install
cd ..

````

4. **Install Python microservice dependencies**
   ```bash
cd python-service
pip install -r requirements.txt
cd ..
````

### Running the Application

1. **Start the backend API**

   ```bash
   ```

npm run dev

# or

node server.js

````

2. **Start the React client**
   ```bash
cd client
npm start
````

3. **Run the Python microservice**

   ```bash
   ```

cd python-service
python app.py

```

Access the client at `http://localhost:3000` and backend at `http://localhost:5000`.

---

## Project Structure

```

FarmiCulture/
│
├── .env                  # Root environment variables
├── package.json          # Node.js backend config
├── server.js             # Express entry point
├── routes/               # Express route handlers
├── models/               # Mongoose schemas
├── middleware/           # Auth & error handling
├── config/               # DB, Redis, Razorpay setup
├── services/             # Email & other services
├── jobs/                 # Scheduled background jobs
├── scripts/              # Utility scripts (seeding, auth)
├── validators/           # Request validation logic
├── client/               # React frontend
├── python-service/       # Flask microservice for AI
└── uploads/              # User-uploaded images

```

Refer to subdirectories for detailed file listings.

---

## API Endpoints

- **Auth**: `/api/users/register`, `/api/users/login`, `/api/users/otp`, `/api/users/reset`
- **Farms**: `/api/farms`
- **Crop Recommendation**: `/api/crops/recommend`
- **Disease Detection**: `/api/disease/detect`
- **Fertilizer**: `/api/fertilizer/recommend`
- **Products**: `/api/products`
- **Orders**: `/api/orders`
- **Payments**: `/api/orders/razorpay`
- **Forum**: `/api/posts`
- **Contact**: `/api/contact`
- **Uploads**: `/api/upload`

---

## Scripts & Jobs

- **Seeding**: `node scripts/seedProducts.js`
- **Refresh Token**: `node scripts/getRefreshToken.js`
- **Background Jobs**: `jobs/cleanFailedOrder.js`, `jobs/deliveryStatusUpdate.js`, `jobs/orderVerification.js`

---

## Testing

- **Backend**: `npm test` (test.js)
- **Frontend**: `npm run test` in `client/`

---

## Deployment

- **Backend & Python Service**: Deployed on Render
- **Frontend**: Hosted on Vercel
- **CI/CD**: GitHub Actions pipelines for linting, testing, and deploy

---

