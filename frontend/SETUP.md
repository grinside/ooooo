# Max IT TV Frontend - Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend API running on port 8000 (or configure VITE_API_URL)

### Installation Steps

1. **Navigate to frontend directory**
```bash
cd /home/user/ooooo/frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` and set your API URL:
```
VITE_API_URL=http://localhost:8000/api
```

4. **Start development server**
```bash
npm run dev
```

Visit http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Overview

### 61 Files Created

**Configuration (6 files)**
- package.json - Dependencies and scripts
- vite.config.js - Vite configuration with aliases
- tailwind.config.js - TailwindCSS with Max IT TV theme
- postcss.config.js - PostCSS configuration
- index.html - HTML entry point with SEO tags
- Dockerfile - Production Nginx deployment

**Services (4 files)**
- api.js - Axios instance with interceptors
- affiliateService.js - Affiliate API calls
- subscriptionService.js - Subscription API calls
- adminService.js - Admin API calls

**State Management (2 files)**
- authStore.js - Authentication state (Zustand)
- appStore.js - Global app state (Zustand)

**Custom Hooks (3 files)**
- useAuth.js - Authentication hook
- useApi.js - API call hook with loading states
- useLocalStorage.js - Local storage hook

**Utilities (4 files)**
- constants.js - App constants, countries, payment providers
- format.js - Formatting utilities (currency, date, number)
- validation.js - Form validation helpers
- helpers.js - Common helper functions

**UI Components (8 files)**
- Button.jsx - Reusable button with variants
- Input.jsx - Form input with validation
- Card.jsx - Card container
- Modal.jsx - Modal dialog
- Loader.jsx - Loading spinner
- Alert.jsx - Alert messages
- Badge.jsx - Status badges
- Table.jsx - Data table with sorting

**Layout Components (4 files)**
- Header.jsx - Header with navigation
- Footer.jsx - Footer with links
- Sidebar.jsx - Dashboard sidebar
- QRCodeGenerator.jsx - QR code display

**Main Files (3 files)**
- main.jsx - React entry point
- App.jsx - Main app with routing
- index.css - Global styles

**Public Pages (3 files)**
- Landing.jsx - Client landing page with offers
- PaymentPage.jsx - Payment processing
- SuccessPage.jsx - Payment success confirmation

**Affiliate Pages (6 files)**
- Register.jsx - Two-step registration
- Login.jsx - Login with phone + PIN
- ForgotPin.jsx - PIN recovery with OTP
- Dashboard.jsx - Affiliate dashboard with stats
- Network.jsx - Network management
- Commissions.jsx - Commission history
- Payouts.jsx - Payout requests
- QRCode.jsx - QR code & share links
- Profile.jsx - Profile settings

**Admin Pages (8 files)**
- Login.jsx - Admin login
- Dashboard.jsx - Admin dashboard with system stats
- Affiliates.jsx - Affiliates management
- Subscriptions.jsx - Subscriptions management
- Payouts.jsx - Payout processing
- Offers.jsx - Offers management
- Reports.jsx - Reports & analytics
- System.jsx - System health monitoring

**Additional Files**
- .env.example - Environment variables template
- .gitignore - Git ignore rules
- README.md - Complete documentation
- SETUP.md - This setup guide
- nginx.conf - Nginx configuration for Docker
- docker-entrypoint.sh - Docker entry script
- manifest.json - PWA manifest
- robots.txt - SEO robots file

## Architecture

### State Management
- Zustand for global state (auth, app)
- React hooks for local state
- Persistent auth state in localStorage

### Routing
- React Router v6 with lazy loading
- Protected routes for authenticated pages
- Role-based access control (affiliate/admin)

### API Integration
- Centralized API service layer
- Automatic token injection
- Error handling with toast notifications
- Request/response interceptors

### Styling
- TailwindCSS utility-first approach
- Custom color palette (Orange #FF6B00, Blue #0066FF)
- Mobile-first responsive design
- Dark mode ready

### Performance
- Code splitting with React.lazy
- Optimized Vite build
- Manual chunk splitting for vendors
- Tree-shaking enabled

## Testing

### Access the Application

**Client Landing**
- Navigate to http://localhost:3000
- View offers and subscribe

**Affiliate Portal**
- Register: http://localhost:3000/affiliate/register
- Login: http://localhost:3000/affiliate/login
- Test with any phone number and 4-digit PIN

**Admin Portal**
- Login: http://localhost:3000/admin/login
- Test credentials from backend setup

## Production Deployment

### Option 1: Static Build + Nginx

```bash
npm run build
```

Serve the `dist` folder with any web server.

### Option 2: Docker

```bash
docker build -t max-it-tv-frontend .
docker run -p 80:80 \
  -e VITE_API_URL=https://api.maxittv.com/api \
  max-it-tv-frontend
```

### Option 3: Vercel/Netlify

1. Connect repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL`

## Troubleshooting

### Port Already in Use
```bash
# Change port in vite.config.js or use:
npm run dev -- --port 3001
```

### API Connection Issues
- Verify backend is running
- Check VITE_API_URL in .env
- Check CORS settings on backend
- Open browser console for errors

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Module Not Found
```bash
# Ensure all dependencies are installed
npm install
```

## Feature Highlights

### Mobile-First Design
- Responsive breakpoints (sm, md, lg, xl)
- Touch-friendly UI elements (min 44px)
- Mobile navigation menu
- Optimized images

### Real-Time Features
- Payment status polling
- Live dashboard updates
- Instant notifications

### Security
- JWT token management
- XSS prevention
- CSRF protection
- Input sanitization
- Role-based access

### Accessibility
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support

## Next Steps

1. **Customize Branding**
   - Update colors in tailwind.config.js
   - Replace logo in Header.jsx
   - Update meta tags in index.html

2. **Add Analytics**
   - Google Analytics
   - Facebook Pixel
   - Custom event tracking

3. **Enhance Features**
   - Email notifications
   - Push notifications (PWA)
   - Multi-language support
   - Theme switcher (dark mode)

4. **Performance Optimization**
   - Image optimization
   - Service worker caching
   - Lazy load images
   - Compress assets

## Support

For issues or questions:
- Email: support@maxittv.com
- Documentation: README.md
- Backend Setup: ../backend/README.md
