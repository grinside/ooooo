import React, { useEffect, useState } from 'react';
import Header from '@components/Layout/Header';
import Sidebar from '@components/Layout/Sidebar';
import Card from '@components/UI/Card';
import QRCodeGenerator from '@components/QRCodeGenerator';
import Button from '@components/UI/Button';
import { Share2, Facebook, MessageCircle } from 'lucide-react';
import affiliateService from '@services/affiliateService';
import { shareOnSocial, formatAffiliateLink } from '@utils/helpers';
import useAuthStore from '@store/authStore';

const QRCode = () => {
  const { user } = useAuthStore();
  const [affiliateLink, setAffiliateLink] = useState('');

  useEffect(() => {
    if (user?.referral_code) {
      setAffiliateLink(formatAffiliateLink(user.referral_code));
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar userType="affiliate" />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">QR Code & Share Links</h1>
            
            <QRCodeGenerator 
              value={affiliateLink}
              title="My Affiliate QR Code"
              description="Share this QR code or link to earn commissions"
            />

            <Card className="mt-6" title="Share on Social Media">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  icon={<MessageCircle size={18} />}
                  onClick={() => shareOnSocial('whatsapp', 'Join Max IT TV', affiliateLink)}
                  fullWidth
                >
                  WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  icon={<Facebook size={18} />}
                  onClick={() => shareOnSocial('facebook', 'Join Max IT TV', affiliateLink)}
                  fullWidth
                >
                  Facebook
                </Button>
                <Button 
                  variant="outline" 
                  icon={<Share2 size={18} />}
                  onClick={() => shareOnSocial('telegram', 'Join Max IT TV', affiliateLink)}
                  fullWidth
                >
                  Telegram
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default QRCode;
