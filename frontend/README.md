# Max IT TV - Frontend Application

Complete React frontend for the Max IT TV affiliation system with 5 main interfaces.

## Features

- **Mobile-first responsive design**
- **Client landing page** with subscription offers
- **Affiliate registration and dashboard** with network management
- **Admin back-office** with comprehensive management tools
- **Real-time payment processing**
- **QR code generation for affiliates**
- **Interactive charts and analytics**

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── UI/          # Base UI components (Button, Input, etc.)
│   │   └── Layout/      # Layout components (Header, Footer, etc.)
│   ├── pages/
│   │   ├── public/      # Client landing pages
│   │   ├── affiliate/   # Affiliate dashboard
│   │   └── admin/       # Admin back-office
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── store/           # State management (Zustand)
│   ├── utils/           # Utilities and helpers
│   ├── App.jsx          # Main app with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── Dockerfile
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL:
```
VITE_API_URL=http://localhost:8000/api
```

## Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Docker Deployment

Build the Docker image:
```bash
docker build -t max-it-tv-frontend .
```

Run the container:
```bash
docker run -p 80:80 -e VITE_API_URL=https://api.maxittv.com/api max-it-tv-frontend
```

## Main Routes

### Public Routes
- `/` - Landing page with offers
- `/payment/:id` - Payment processing page
- `/success/:reference` - Payment success page

### Affiliate Routes
- `/affiliate/register` - Registration form
- `/affiliate/login` - Login page
- `/affiliate/dashboard` - Main dashboard
- `/affiliate/network` - Network management
- `/affiliate/commissions` - Commission history
- `/affiliate/payouts` - Payout management
- `/affiliate/qr-code` - QR code & share links
- `/affiliate/profile` - Profile settings

### Admin Routes
- `/admin/login` - Admin login
- `/admin/dashboard` - Admin dashboard
- `/admin/affiliates` - Affiliates management
- `/admin/subscriptions` - Subscriptions management
- `/admin/payouts` - Payouts management
- `/admin/offers` - Offers management
- `/admin/reports` - Reports & analytics
- `/admin/system` - System health monitoring

## Features by Interface

### 1. Client Landing Page
- Detect affiliate code from URL (?ref=CODE)
- Display available offers by country
- Mobile-first responsive design
- Payment provider selection
- Real-time payment status polling

### 2. Affiliate Registration
- Two-step registration (personal info + PIN)
- Phone number validation
- Country selection
- Optional sponsor code
- PIN recovery with OTP

### 3. Affiliate Dashboard
- Real-time stats (commissions, sales, network size)
- Interactive charts (sales, commission trends)
- Network visualization and management
- Commission history with filters
- Payout requests
- QR code generation and sharing
- Profile management

### 4. Admin Back-Office
- System dashboard with key metrics
- Affiliate approval and management
- Subscription monitoring
- Payout processing (approve/reject)
- Offer management
- Sales and commission reports
- System health monitoring

### 5. Protected Routes
- Authentication checks
- Role-based access control
- Automatic redirects

## Color Scheme

- **Primary (Orange)**: `#FF6B00`
- **Secondary (Blue)**: `#0066FF`
- **Success**: `#10B981`
- **Warning**: `#F59E0B`
- **Error**: `#EF4444`

## Development Guidelines

### Adding New Pages
1. Create page component in appropriate directory
2. Add route in `src/App.jsx`
3. Use existing UI components for consistency
4. Follow mobile-first responsive design

### State Management
- Use Zustand stores for global state
- `authStore.js` - Authentication state
- `appStore.js` - Application state

### API Integration
- All API calls go through service files in `src/services/`
- Use the `useApi` hook for API calls with loading states
- Error handling is automatic via Axios interceptors

### Styling
- Use TailwindCSS utility classes
- Follow mobile-first approach
- Use existing color palette from `tailwind.config.js`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome)

## Performance

- Code splitting with React lazy loading
- Optimized bundle with Vite
- Image optimization
- Responsive images with srcset
- Service worker ready for PWA

## Security

- XSS prevention via React
- CSRF token handling
- Secure token storage
- Input sanitization
- Role-based access control

## License

Proprietary - Max IT TV

## Support

For support, email support@maxittv.com
