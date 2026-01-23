import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-xl font-bold text-white">Max IT TV</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Premium TV streaming service with an innovative affiliate program.
              Join us and start earning today!
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-500 transition-colors"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-500 transition-colors"
              >
                <Twitter size={16} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-500 transition-colors"
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-primary-500 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/affiliate/register" className="text-sm hover:text-primary-500 transition-colors">
                  Become an Affiliate
                </Link>
              </li>
              <li>
                <Link to="/affiliate/login" className="text-sm hover:text-primary-500 transition-colors">
                  Affiliate Login
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-sm hover:text-primary-500 transition-colors">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm hover:text-primary-500 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-primary-500 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-primary-500 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-primary-500 transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-primary-500" />
                <a href="mailto:support@maxittv.com" className="hover:text-primary-500 transition-colors">
                  support@maxittv.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-primary-500" />
                <a href="tel:+221123456789" className="hover:text-primary-500 transition-colors">
                  +221 12 345 67 89
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} Max IT TV. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
